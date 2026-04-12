// Load environment variables first
require('dotenv').config();

// Imports
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
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

// TEST NEON DATABASE
pool.query('SELECT current_database(), current_schema();')
  .then(res => console.log('✅ Connected to DB:', res.rows))
  .catch(err => console.error('❌ DB connection error:', err));

// Test database connection on startup
pool.query('SELECT NOW()').then(() => {
  console.log('✅ Database connected successfully');
  console.log('✅ PostgreSQL session store configured');
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
});

// Use CORS with production and development origins
const allowedOrigins = [
  'http://localhost:3001', // Development frontend
  process.env.FRONTEND_URL || 'https://respv2.onrender.com' // Production frontend
].filter(Boolean);

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true, // Allow cookies to be sent if you're using sessions
}));

// Trust Render's reverse proxy so secure cookies work
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session config
const isProduction = process.env.NODE_ENV === 'production';
const sessionConfig = {
  store: new pgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid',
  proxy: isProduction, // Trust Render's proxy
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    secure: isProduction,       // HTTPS only in production
    sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-site cookies
    httpOnly: true
  }
};

console.log('📋 Session config:', sessionConfig);
app.use(session(sessionConfig));

// Test middleware to verify session middleware is working
app.use((req, res, next) => {
  console.log('🔧 Session middleware check:');
  console.log('- Session object exists:', !!req.session);
  console.log('- Session ID:', req.sessionID);
  console.log('- Session store:', !!req.sessionStore);
  next();
});

// Debug middleware to log session activity for /user/me and /login
app.use((req, res, next) => {
  if (req.path === '/user/me' || req.path === '/login') {
    console.log(`🚦 ${req.method} ${req.path}`);
    console.log('- Session ID:', req.sessionID);
    console.log('- Session userId:', req.session?.userId);
    console.log('- Has cookies:', !!req.headers.cookie);
  }
  next();
});

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

    // Generate a simple auth token as backup for cross-origin authentication
    const authToken = `${user.id}.${Date.now()}.${crypto.randomBytes(16).toString('hex')}`;

    console.log('🔐 Session created after login:');
    console.log('- Session ID:', req.sessionID);
    console.log('- User ID:', req.session.userId);
    console.log('- Email:', req.session.email);
    console.log('- Auth token generated:', authToken);
    console.log('- Full session before save:', req.session);
    console.log('- Request headers:', req.headers);
    console.log('- Cookie before save:', req.headers.cookie);

    // Explicitly save the session
    req.session.save(async (err) => {
      if (err) {
        console.error('❌ Session save error:', err);
        return res.status(500).json({ message: "Session save failed" });
      }
      
      console.log('✅ Session saved successfully');
      console.log('- Session ID after save:', req.sessionID);
      console.log('- Full session after save:', req.session);
      console.log('- Setting Set-Cookie header for domain:', req.get('host'));
      console.log('✅ Using PostgreSQL session store');
      
      // Manually set the session cookie if Express isn't doing it automatically
      // Since cookies are being rejected, focus on token-based authentication
      console.log('📤 Cookies may be rejected by browser due to cross-origin restrictions');
      console.log('📤 Relying on token-based authentication for cross-origin requests');
      
      res.status(200).json({
        message: "Login successful",
        user: {
          email: user.email,
          display_name: user.display_name,
          profile_picture: user.profile_picture || null
        },
        authToken: authToken // Primary authentication method for cross-origin
      });
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
  console.log('🔍 Forgot password request for email:', email);

  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1', 
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(400).json({ message: "Email not found" });
    }

    console.log('✅ User found:', user.display_name);

    const token = crypto.randomBytes(32).toString('hex');
    console.log('🔑 Generated reset token:', token);

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = NOW() + interval \'1 hour\' WHERE email = $2',
      [token, email]
    );

    console.log('✅ Token saved to database');

    const frontendUrl = process.env.FRONTEND_URL || 'https://respv2.onrender.com';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    console.log('📧 Attempting to send email to:', email);
    console.log('🔗 Reset link:', resetLink);
    console.log('📤 From address: onboarding@resend.dev');
    console.log('🔑 Using Resend API key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');

    const emailResult = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Password Reset - RESPV2',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your RESPV2 account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    });

    console.log('📬 Resend API response:', emailResult);

    if (emailResult.error) {
      console.error('❌ Resend API error:', emailResult.error);
      console.error('❌ Error details:', JSON.stringify(emailResult.error, null, 2));
      console.error('❌ Error type:', typeof emailResult.error);
      console.error('❌ Error message:', emailResult.error.message);
      return res.status(500).json({ 
        message: "Failed to send email", 
        error: emailResult.error.message,
        details: emailResult.error
      });
    }

    console.log('✅ Email sent successfully to:', email);
    console.log('✅ Email ID:', emailResult.data?.id);
    res.status(200).json({ message: "Password reset email sent!" });
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ message: "Internal server error", error: err.message });
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
  const keys = Object.keys(req.body).filter(k => k !== 'currentPassword');

  if (keys.length !== 1 || !allowedFields.includes(keys[0])) {
    return res.status(400).json({ message: 'Invalid update field' });
  }

  const field = keys[0];
  const value = req.body[field];

  try {
    if (field === 'password') {
      const { currentPassword } = req.body;
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }

      // Verify current password
      const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!isMatch) {
        return res.status(403).json({ message: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(value, 10);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);
    } else if (field === 'email') {
      const normalizedEmail = value.trim().toLowerCase();
      await pool.query('UPDATE users SET email = $1 WHERE id = $2', [normalizedEmail, userId]);
    } else if (field === 'profile_picture') {
      // Validate file extension
      const urlLower = value.toLowerCase().split('?')[0];
      if (!urlLower.match(/\.(png|jpg|jpeg)$/)) {
        return res.status(400).json({ message: 'Profile picture URL must end with .png, .jpg, or .jpeg' });
      }

      // Check if the image is animated (APNG detection)
      try {
        const response = await fetch(value);
        if (!response.ok) {
          return res.status(400).json({ message: 'Could not fetch the image URL' });
        }
        const buffer = Buffer.from(await response.arrayBuffer());

        // Check for animated PNG (APNG) - look for 'acTL' chunk which indicates animation
        if (urlLower.endsWith('.png')) {
          const acTL = Buffer.from('acTL');
          for (let i = 0; i < buffer.length - 4; i++) {
            if (buffer[i] === acTL[0] && buffer[i + 1] === acTL[1] && buffer[i + 2] === acTL[2] && buffer[i + 3] === acTL[3]) {
              return res.status(400).json({ message: 'Animated images are not allowed as profile pictures' });
            }
          }
        }
      } catch (fetchErr) {
        console.error('Error validating profile picture:', fetchErr);
        return res.status(400).json({ message: 'Could not validate the image. Please check the URL.' });
      }

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
  console.log('🔍 /user/me endpoint called');
  console.log('- Session ID:', req.sessionID);
  console.log('- Session data:', req.session);
  console.log('- Request cookies:', req.headers.cookie);
  console.log('- User ID from session:', req.session.userId);
  console.log('- Authorization header:', req.headers.authorization);

  let userId = null;

  // Try session first
  if (req.session.userId) {
    userId = req.session.userId;
    console.log('✅ Using session authentication, userId:', userId);
  } 
  // Try auth token as backup
  else if (req.headers.authorization) {
    const authToken = req.headers.authorization.replace('Bearer ', '');
    console.log('🔑 Trying token authentication:', authToken);
    
    // Parse token (format: userId.timestamp.randomHex)
    const tokenParts = authToken.split('.');
    if (tokenParts.length === 3) {
      const tokenUserId = parseInt(tokenParts[0]);
      const timestamp = parseInt(tokenParts[1]);
      const now = Date.now();
      
      // Check if token is not older than 24 hours
      if (!isNaN(tokenUserId) && !isNaN(timestamp) && (now - timestamp) < 24 * 60 * 60 * 1000) {
        userId = tokenUserId;
        console.log('✅ Using token authentication, userId:', userId);
      } else {
        console.log('❌ Token expired or invalid');
      }
    } else {
      console.log('❌ Token format invalid');
    }
  }

  if (!userId) {
    console.log('❌ No valid authentication found - returning 401');
    return res.status(401).json({ message: 'Not logged in' });
  }

  try {
    const result = await pool.query(
      'SELECT display_name, profile_picture, role FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];
    if (!user) {
      console.log('❌ User not found in database for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Auth check successful for user:', user.display_name);
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
        users.id,
        users.display_name, 
        users.profile_picture,
        users.points,
        users.prediction_points,
        users.lifetime_prediction_points,
        users.role,
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

    // Fetch tournament count and win rate
    const statsResult = await pool.query(`
      SELECT
        COUNT(DISTINCT tp.tournament_id) AS tournaments_played,
        COUNT(CASE WHEN tm.winner_id = $1 AND tm.bye_match = false THEN 1 END) AS wins,
        COUNT(CASE WHEN tm.winner_id IS NOT NULL AND tm.bye_match = false AND (tm.player1_id = $1 OR tm.player2_id = $1) THEN 1 END) AS completed_matches
      FROM tournament_participants tp
      LEFT JOIN tournament_matches tm
        ON tm.tournament_id = tp.tournament_id
        AND (tm.player1_id = $1 OR tm.player2_id = $1)
      WHERE tp.user_id = $1
    `, [user.id]);

    const stats = statsResult.rows[0];
    const completedMatches = parseInt(stats.completed_matches) || 0;
    const wins = parseInt(stats.wins) || 0;
    user.tournaments_played = parseInt(stats.tournaments_played) || 0;
    user.win_rate = completedMatches > 0 ? Math.round((wins / completedMatches) * 100) : 0;

    delete user.id;
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== GET MATCH HISTORY FOR USER ====================

app.get('/user/:displayname/matches', async (req, res) => {
  const { displayname } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 5, 20);

  try {
    const userResult = await pool.query(
      'SELECT id FROM users WHERE LOWER(display_name) = LOWER($1)',
      [displayname]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = userResult.rows[0].id;

    const matchesResult = await pool.query(`
      SELECT
        tm.id,
        tm.player1_id, tm.player2_id, tm.winner_id,
        tm.player1_score, tm.player2_score,
        tm.vod_url,
        tm.updated_at,
        t.id AS tournament_id, t.name AS tournament_name,
        u1.display_name AS player1_name,
        u2.display_name AS player2_name
      FROM tournament_matches tm
      JOIN tournaments t ON t.id = tm.tournament_id
      LEFT JOIN users u1 ON u1.id = tm.player1_id
      LEFT JOIN users u2 ON u2.id = tm.player2_id
      WHERE (tm.player1_id = $1 OR tm.player2_id = $1)
        AND tm.winner_id IS NOT NULL
        AND tm.bye_match = false
      ORDER BY tm.updated_at DESC
      LIMIT $2
    `, [userId, limit]);

    const matches = matchesResult.rows.map(m => {
      const isPlayer1 = m.player1_id === userId;
      const won = m.winner_id === userId;
      return {
        id: m.id,
        opponent: isPlayer1 ? m.player2_name : m.player1_name,
        result: won ? 'W' : 'L',
        score: isPlayer1
          ? `${m.player1_score ?? 0} – ${m.player2_score ?? 0}`
          : `${m.player2_score ?? 0} – ${m.player1_score ?? 0}`,
        tournament: m.tournament_name,
        tournament_id: m.tournament_id,
        vod_url: m.vod_url || null,
        date: m.updated_at,
      };
    });

    res.json(matches);
  } catch (err) {
    console.error('Error fetching match history:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== GET RIVALS FOR USER ====================

app.get('/user/:displayname/rivals', async (req, res) => {
  const { displayname } = req.params;

  try {
    const userResult = await pool.query(
      'SELECT id FROM users WHERE LOWER(display_name) = LOWER($1)',
      [displayname]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = userResult.rows[0].id;

    const rivalsResult = await pool.query(`
      SELECT
        ur.rival_id,
        u.display_name,
        u.profile_picture
      FROM user_rivals ur
      JOIN users u ON u.id = ur.rival_id
      WHERE ur.user_id = $1
      ORDER BY ur.created_at
    `, [userId]);

    // For each rival, compute head-to-head record
    const rivals = [];
    for (const rival of rivalsResult.rows) {
      const h2hResult = await pool.query(`
        SELECT
          COUNT(CASE WHEN winner_id = $1 THEN 1 END) AS wins,
          COUNT(CASE WHEN winner_id = $2 THEN 1 END) AS losses
        FROM tournament_matches
        WHERE bye_match = false
          AND winner_id IS NOT NULL
          AND ((player1_id = $1 AND player2_id = $2) OR (player1_id = $2 AND player2_id = $1))
      `, [userId, rival.rival_id]);

      const wins = parseInt(h2hResult.rows[0].wins) || 0;
      const losses = parseInt(h2hResult.rows[0].losses) || 0;

      rivals.push({
        display_name: rival.display_name,
        profile_picture: rival.profile_picture,
        wins,
        losses,
      });
    }

    res.json(rivals);
  } catch (err) {
    console.error('Error fetching rivals:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== ADD RIVAL ====================

app.post('/user/rivals', authMiddleware, async (req, res) => {
  const userId = req.userId;
  const { rival_name } = req.body;

  if (!rival_name) {
    return res.status(400).json({ message: 'rival_name is required' });
  }

  try {
    // Find rival user
    const rivalResult = await pool.query(
      'SELECT id FROM users WHERE LOWER(display_name) = LOWER($1)',
      [rival_name]
    );
    if (rivalResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const rivalId = rivalResult.rows[0].id;

    if (rivalId === userId) {
      return res.status(400).json({ message: 'You cannot add yourself as a rival' });
    }

    // Check limit (max 3)
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM user_rivals WHERE user_id = $1',
      [userId]
    );
    if (parseInt(countResult.rows[0].count) >= 3) {
      return res.status(400).json({ message: 'You can have at most 3 rivals' });
    }

    await pool.query(
      'INSERT INTO user_rivals (user_id, rival_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, rivalId]
    );

    res.status(201).json({ message: 'Rival added' });
  } catch (err) {
    console.error('Error adding rival:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== REMOVE RIVAL ====================

app.delete('/user/rivals/:rivalName', authMiddleware, async (req, res) => {
  const userId = req.userId;
  const { rivalName } = req.params;

  try {
    const rivalResult = await pool.query(
      'SELECT id FROM users WHERE LOWER(display_name) = LOWER($1)',
      [rivalName]
    );
    if (rivalResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await pool.query(
      'DELETE FROM user_rivals WHERE user_id = $1 AND rival_id = $2',
      [userId, rivalResult.rows[0].id]
    );

    res.json({ message: 'Rival removed' });
  } catch (err) {
    console.error('Error removing rival:', err);
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
    console.log('🔍 Attempting to fetch leaderboard data...');
    // Query to fetch leaderboard data with tied-rank support (same rank, skip next)
    // Users with 0 points get rank = null (unranked)
    const query = `
      SELECT display_name, points, profile_picture,
        CASE WHEN points > 0
          THEN RANK() OVER (ORDER BY CASE WHEN points > 0 THEN 0 ELSE 1 END, points DESC)
          ELSE NULL
        END AS rank
      FROM users
      ORDER BY points DESC, display_name ASC;
    `;
    const { rows } = await pool.query(query);
    console.log(`✅ Leaderboard query successful, returned ${rows.length} users`);

    // Send the fetched data as JSON response
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching leaderboard data:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// ++++++++++++++++++++++ TOURNAMENT RELATED ++++++++++++++++++++++
app.use('/tournaments', require('./routes/tournaments'));

// ++++++++++++++++++++++ PREDICTIONS ++++++++++++++++++++++
app.use('/predictions', require('./routes/predictions'));

// ++++++++++++++++++++++ SEALS ++++++++++++++++++++++
app.use('/seals', require('./routes/seals'));

// ++++++++++++++++++++ SERVER +++++++++++++++++
// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
