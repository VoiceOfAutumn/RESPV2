// Load environment variables first
require('dotenv').config();

// Imports
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const crypto = require('crypto');
const { Resend } = require('resend');
const pool = require('./db');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('./middleware/authMiddleware');

// ReSend setup
const resend = new Resend(process.env.RESEND_API_KEY);

// Create server
const cors = require('cors');
const app = express();
const PORT = 3000;

// Use CORS with production and development origins
const allowedOrigins = [
  'http://localhost:3001', // Development frontend
  process.env.FRONTEND_URL || 'https://respv2.onrender.com' // Production frontend
].filter(Boolean);

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true, // Allow cookies to be sent if you're using sessions
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session config
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: null, // Session expires on browser close unless "remember me"
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-site cookies in production
    httpOnly: true // Prevent XSS attacks
  }
}));

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

    console.log('Session after login:', req.session);  // Log session details

    res.status(200).json({
      message: "Login successful",
      user: {
        email: user.email,
        display_name: user.display_name,
        profile_picture: user.profile_picture || null // <-- Added here
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
    res.clearCookie('connect.sid');
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

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

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

// ++++++++++++++++++++ USER DATA RELATED ++++++++++++++++++++

// ================== GET /usersettings ==================

app.get('/usersettings', authMiddleware, async (req, res) => {
  const userId = req.session.userId; // Assuming userId is stored in the session

  try {
    // Query the database to get the user's settings
    const result = await pool.query(`
      SELECT display_name, email, country_id, profile_picture
      FROM users
      WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Send back the user's profile data
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user settings:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ================== POST /usersettings (UPDATE USER SETTINGS)==================

app.put('/user/update', authMiddleware, async (req, res) => {
  console.log('Session:', req.session); // ✅ log full session object
  const userId = req.session.userId;
  console.log('userId:', userId);       // ✅ confirm this is a number or valid ID

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: No session userId' });
  }

  const allowedFields = ['email', 'password', 'country_id', 'profile_picture'];
  const keys = Object.keys(req.body);

  if (keys.length !== 1 || !allowedFields.includes(keys[0])) {
    return res.status(400).json({ message: 'Invalid update field' });
  }

  const field = keys[0];
  const value = req.body[field];

  try {
    if (field === 'password') {
      const hashedPassword = await bcrypt.hash(value, 10);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);
    } else if (field === 'email') {
      const normalizedEmail = value.trim().toLowerCase();
      await pool.query('UPDATE users SET email = $1 WHERE id = $2', [normalizedEmail, userId]);
    } else if (field === 'profile_picture') {
      // Optional: validate .png/.jpg/.jpeg
      await pool.query('UPDATE users SET profile_picture = $1 WHERE id = $2', [value, userId]);
    } else if (field === 'country_id') {
      await pool.query('UPDATE users SET country_id = $1 WHERE id = $2', [value, userId]);
    }

    res.status(200).json({ message: `${field} updated` });
  } catch (err) {
    console.error(`Error updating ${field}:`, err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// =================== GET user/me ==================

app.get('/user/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not logged in' });
  }

  try {
    const result = await pool.query(
      'SELECT display_name, profile_picture, role FROM users WHERE id = $1',
      [req.session.userId]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      displayName: user.display_name,
      profile_picture: user.profile_picture,
      role: user.role
    });
  } catch (err) {
    console.error('Error in /user/me:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// =================== GET USER BY DISPLAY NAME ==================

app.get('/user/:displayname', async (req, res) => {
  const { displayname } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        users.display_name, 
        users.profile_picture,
        users.points,
        countries.code as country_code,
        countries.name as country_name
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

// ==================== GET COUNTRY LIST ====================

app.get('/countries', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM countries ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching countries:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


//=================== GET LEADERBOARD DATA ==================

app.get('/leaderboard', async (req, res) => {
  try {
    // Query to fetch leaderboard data (display name and points sorted by points)
    const query = `
      SELECT display_name, points, profile_picture
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
app.use('/tournaments', require('./routes/tournament-router'));

// ++++++++++++++++++++ SERVER +++++++++++++++++
// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
