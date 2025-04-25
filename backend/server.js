// Load environment variables first
require('dotenv').config();

// Imports
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const crypto = require('crypto');
const { Resend } = require('resend');
const pool = require('./db');
const multer = require('multer');
const path = require('path');

// ReSend setup
const resend = new Resend(process.env.RESEND_API_KEY);

// Create server
const cors = require('cors');
const app = express();
const PORT = 3000;

// Use CORS with a specific origin (your frontend URL)
app.use(cors({ 
  origin: 'http://localhost:3001', // replace with the URL of your frontend if different
  credentials: true, // Allow cookies to be sent if you're using sessions
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Setup multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory to store images
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

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
  let { display_name, email, password, country_id } = req.body;

  if (!display_name || !email || !password || !country_id) {
    return res.status(400).json({ message: "All fields are required" });
  }

  country_id = parseInt(country_id, 10);
  if (isNaN(country_id)) {
    return res.status(400).json({ message: "Invalid country ID" });
  }

  email = email.toLowerCase();

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
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)', 
      [email]
    );

    if (result.rows.length > 0) {
      return res.status(400).json({ message: "Email already taken" });
    }

    const displayNameResult = await pool.query(
      'SELECT * FROM users WHERE LOWER(display_name) = LOWER($1)', 
      [display_name]
    );

    if (displayNameResult.rows.length > 0) {
      return res.status(400).json({ message: "Display name already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (display_name, email, password_hash, country_id) VALUES ($1, $2, $3, $4)',
      [display_name, email, hashedPassword, country_id]
    );

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ================== LOGIN ==================
app.post('/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [normalizedEmail]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Lockout logic
    if (user.failed_attempts >= 5) {
      const lastFailed = new Date(user.last_failed_attempt);
      const minutesSinceLast = (Date.now() - lastFailed) / 1000 / 60;
      if (minutesSinceLast < 15) {
        return res.status(403).json({
          message: `Too many failed attempts. Try again in ${Math.ceil(15 - minutesSinceLast)} minutes.`
        });
      } else {
        // Reset after 15 minutes
        await pool.query('UPDATE users SET failed_attempts = 0 WHERE email = $1', [normalizedEmail]);
      }
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      await pool.query(
        'UPDATE users SET failed_attempts = failed_attempts + 1, last_failed_attempt = NOW() WHERE email = $1',
        [normalizedEmail]
      );
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Reset failed attempts
    if (user.failed_attempts > 0) {
      await pool.query('UPDATE users SET failed_attempts = 0 WHERE email = $1', [normalizedEmail]);
    }

    // Create session
    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.cookie.maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : null;

    res.status(200).json({
      message: "Login successful",
      user: {
        email: user.email,
        display_name: user.display_name,
      }
    });
  } catch (err) {
    console.error("Login error:", err);
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
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1', 
      [email]
    );

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
    const result = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()', 
      [token]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[\d!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: "Password does not meet the required criteria" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    return res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// =================== GET USER BY DISPLAY NAME ==================

app.get('/user/:displayname', async (req, res) => {
  const { displayname } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        users.display_name, 
        countries.name AS country 
      FROM users 
      LEFT JOIN countries ON users.country_id = countries.id 
      WHERE LOWER(users.display_name) = LOWER($1)
    `, [displayname]);

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//=================== GET LEADERBOARD DATA ==================

app.get('/leaderboard', async (req, res) => {
  try {
    // Query to fetch leaderboard data (display name and points sorted by points)
    const query = `
      SELECT display_name, points
      FROM users
      ORDER BY points DESC;
    `;
    const { rows } = await pool.query(query);

    // Send the fetched data as JSON response
    res.json(rows);
  } catch (err) {
    console.error('Error fetching leaderboard data:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ++++++++++++++++++++++ TOURNAMENT RELATED ++++++++++++++++++++++

// ================== GET /tournaments ==================

app.get('/tournaments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, date, status
      FROM tournaments
      ORDER BY date
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ================== GET /tournaments/:id ==================

app.get('/tournaments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT *
      FROM tournaments
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ================== POST /tournaments/id/signup ==================

router.post('/tournaments/:id/signup', async (req, res) => {
  const tournamentId = parseInt(req.params.id);
  const userId = req.user.id; // Assuming the user is logged in

  try {
    // Check if tournament exists
    const tournament = await db.query('SELECT * FROM tournaments WHERE id = $1', [tournamentId]);
    if (tournament.rows.length === 0) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Check if user is already signed up
    const existingSignup = await db.query(
      'SELECT * FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2',
      [tournamentId, userId]
    );
    if (existingSignup.rows.length > 0) {
      return res.status(400).json({ message: 'Already signed up' });
    }

    // Add user to tournament_participants table
    await db.query(
      'INSERT INTO tournament_participants (tournament_id, user_id) VALUES ($1, $2)',
      [tournamentId, userId]
    );

    return res.status(200).json({ message: 'Signed up successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error signing up' });
  }
});

// ++++++++++++++++++++ SERVER +++++++++++++++++
// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
