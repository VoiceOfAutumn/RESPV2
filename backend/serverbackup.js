//Main Server File//
require('dotenv').config();

const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('./db');
const session = require('express-session');
const crypto = require('crypto');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();
const PORT = 3000;

// Middleware for parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up session management
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: null // Default: no fixed duration
  }
}));

// /signup route
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  // Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if user already exists
    const result = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (result.rows.length > 0) {
      return res.status(400).json({ message: "Username or email already taken" });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the new user into the database
    await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)', [username, email, hashedPassword]);

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// /login route
app.post('/login', async (req, res) => {
  console.log('Login route accessed');
  const { username, password, rememberMe } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Fetch the user
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // STEP 1: Check if locked out due to failed attempts
    if (user.failed_attempts >= 5) {
      const lastFailedTime = new Date(user.last_failed_attempt);
      const diffInMinutes = (new Date() - lastFailedTime) / (1000 * 60);

      if (diffInMinutes < 15) {
        return res.status(403).json({
          message: `Too many failed attempts. Try again in ${15 - Math.floor(diffInMinutes)} minutes.`
        });
      } else {
        // Reset counter if 15 minutes passed
        await pool.query('UPDATE users SET failed_attempts = 0 WHERE username = $1', [username]);
        user.failed_attempts = 0; // clear it locally for future logic
      }
    }

    // STEP 2: Compare password
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      // STEP 3: Wrong password — increment counter
      await pool.query(
        'UPDATE users SET failed_attempts = failed_attempts + 1, last_failed_attempt = NOW() WHERE username = $1',
        [username]
      );
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // STEP 4: Successful login — reset counter
    if (user.failed_attempts > 0) {
      await pool.query('UPDATE users SET failed_attempts = 0 WHERE username = $1', [username]);
    }

    // STEP 5: Setup session
    req.session.userId = user.id;
    req.session.username = user.username;

    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    } else {
      req.session.cookie.expires = false; // ends on browser close
    }

    return res.status(200).json({ message: "Login successful", user: { username: user.username } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// /FORGOT PASSWORD ROUTE
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const crypto = require('crypto');

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).json({ message: "Email not found" });
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Save the token and its expiration (e.g. 1 hour from now)
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = NOW() + interval \'1 hour\' WHERE email = $2',
      [token, email]
    );

    // Construct password reset link
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    // Send the email using ReSend
    const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
      to: email,
      subject: 'Password Reset',
      html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
    });

    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to send email" });
    }

    return res.status(200).json({ message: "Password reset email sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
