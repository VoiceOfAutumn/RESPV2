// Load environment variables first
require('dotenv').config();

// Imports
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const crypto = require('crypto');
const { Resend } = require('resend');
const pool = require('./db');

// ReSend setup
const resend = new Resend(process.env.RESEND_API_KEY);

// Create server
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session config
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: null // Session expires on browser close unless "remember me"
  }
}));

// ================== SIGNUP ==================
app.post('/signup', async (req, res) => {
  let { username, display_name, email, password, country_id } = req.body;

  if (!username || !display_name || !email || !password || !country_id) {
    return res.status(400).json({ message: "All fields are required" });
  }

  email = email.toLowerCase();

  const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({
      message: "Username must be 3–16 characters and only contain letters, numbers, or underscores"
    });
  }

  const displayNameRegex = /^[a-zA-Z0-9_]{3,16}$/;
  if (!displayNameRegex.test(display_name)) {
    return res.status(400).json({
      message: "Display name must be 3-16 characters and contain only letters, numbers, and underscores."
    });
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*[\d!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message: "Password does not meet the required criteria: At least one uppercase letter, one digit or special character, and a minimum length of 8 characters"
    });
  }

  try {
    // Case-insensitive check for existing username or email
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR email = $2',
      [username, email]
    );

    if (result.rows.length > 0) {
      return res.status(400).json({ message: "Username or email already taken" });
    }

    const displayNameResult = await pool.query('SELECT * FROM users WHERE LOWER(display_name) = LOWER($1)', [display_name]);
    if (displayNameResult.rows.length > 0) {
      return res.status(400).json({ message: "Display name already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the user with country_id
    await pool.query('INSERT INTO users (username, display_name, email, password_hash, country_id) VALUES ($1, $2, $3, $4, $5)', [
      username,
      display_name,
      email,
      hashedPassword,
      country_id
    ]);

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// ================== LOGIN ==================
app.post('/login', async (req, res) => {
  const { username, password, rememberMe } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // Check for lockout
    if (user.failed_attempts >= 5) {
      const lastFailed = new Date(user.last_failed_attempt);
      const minutesSinceLast = (Date.now() - lastFailed) / 1000 / 60;
      if (minutesSinceLast < 15) {
        return res.status(403).json({
          message: `Too many failed attempts. Try again in ${Math.ceil(15 - minutesSinceLast)} minutes.`
        });
      } else {
        await pool.query('UPDATE users SET failed_attempts = 0 WHERE username = $1', [username]);
      }
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      await pool.query(
        'UPDATE users SET failed_attempts = failed_attempts + 1, last_failed_attempt = NOW() WHERE username = $1',
        [username]
      );
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // Reset failed attempts
    if (user.failed_attempts > 0) {
      await pool.query('UPDATE users SET failed_attempts = 0 WHERE username = $1', [username]);
    }

    // Set up session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.cookie.maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : null;

    res.status(200).json({ message: "Login successful", user: { username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ================== LOGOUT ==================
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });  

// ================== FORGOT PASSWORD ==================
app.post('/forgot-password', async (req, res) => {
  let { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  email = email.toLowerCase();

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).json({ message: "Email not found" });
    }

    const token = crypto.randomBytes(32).toString('hex');

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = NOW() + interval \'1 hour\' WHERE email = $2',
      [token, email]
    );

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Password Reset',
      html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
    });

    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to send email" });
    }

    res.status(200).json({ message: "Password reset email sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// ================== RESET PASSWORD ==================
app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
  
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }
  
    try {
      // Step 1: Check if the token is valid (exists in the database and not expired)
      const result = await pool.query('SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()', [token]);
      const user = result.rows[0];
  
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
  
      // Step 2: Validate the new password (add password rules here)
      const passwordRegex = /^(?=.*[A-Z])(?=.*[\d!@#$%^&*]).{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ message: "Password does not meet the required criteria" });
      }
  
      // Step 3: Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  
      // Step 4: Update the user's password and invalidate the reset token
      await pool.query('UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2', [hashedPassword, user.id]);
  
      return res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });


// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
