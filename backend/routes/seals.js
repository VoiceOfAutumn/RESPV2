const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Helper: check if current user is admin
async function requireAdmin(req, res) {
  const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.session.userId]);
  if (userResult.rows.length === 0) {
    res.status(401).json({ message: 'User not found' });
    return false;
  }
  if (userResult.rows[0].role !== 'admin') {
    res.status(403).json({ message: 'Only admin can perform this action' });
    return false;
  }
  return true;
}

// ==================== GET /seals — list all seals ====================
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM seals ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching seals:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== POST /seals — create a new seal (admin only) ====================
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;

    const { name, description, image_url } = req.body;
    if (!name || !image_url) {
      return res.status(400).json({ message: 'Name and image_url are required' });
    }

    const result = await pool.query(
      'INSERT INTO seals (name, description, image_url) VALUES ($1, $2, $3) RETURNING *',
      [name, description || '', image_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating seal:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== DELETE /seals/:id — delete a seal (admin only) ====================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;

    const { id } = req.params;
    const result = await pool.query('DELETE FROM seals WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Seal not found' });
    }

    res.json({ message: 'Seal deleted successfully' });
  } catch (err) {
    console.error('Error deleting seal:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== GET /seals/user/:displayname — get seals for a user ====================
router.get('/user/:displayname', async (req, res) => {
  try {
    const { displayname } = req.params;
    const result = await pool.query(`
      SELECT s.id, s.name, s.description, s.image_url, us.awarded_at
      FROM user_seals us
      JOIN seals s ON s.id = us.seal_id
      JOIN users u ON u.id = us.user_id
      WHERE LOWER(u.display_name) = LOWER($1)
      ORDER BY us.awarded_at DESC
    `, [displayname]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user seals:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== POST /seals/:id/award — award seal to user (admin only) ====================
router.post('/:id/award', authMiddleware, async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;

    const sealId = parseInt(req.params.id);
    const { display_name } = req.body;

    if (!display_name) {
      return res.status(400).json({ message: 'display_name is required' });
    }

    // Find user by display name
    const userResult = await pool.query(
      'SELECT id FROM users WHERE LOWER(display_name) = LOWER($1)',
      [display_name]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check seal exists
    const sealResult = await pool.query('SELECT id FROM seals WHERE id = $1', [sealId]);
    if (sealResult.rows.length === 0) {
      return res.status(404).json({ message: 'Seal not found' });
    }

    const userId = userResult.rows[0].id;

    // Award the seal (upsert to avoid duplicate errors)
    await pool.query(
      'INSERT INTO user_seals (user_id, seal_id) VALUES ($1, $2) ON CONFLICT (user_id, seal_id) DO NOTHING',
      [userId, sealId]
    );

    res.json({ message: `Seal awarded to ${display_name}` });
  } catch (err) {
    console.error('Error awarding seal:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== DELETE /seals/:id/award — remove seal from user (admin only) ====================
router.delete('/:id/award', authMiddleware, async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;

    const sealId = parseInt(req.params.id);
    const { display_name } = req.body;

    if (!display_name) {
      return res.status(400).json({ message: 'display_name is required' });
    }

    const userResult = await pool.query(
      'SELECT id FROM users WHERE LOWER(display_name) = LOWER($1)',
      [display_name]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userResult.rows[0].id;
    const result = await pool.query(
      'DELETE FROM user_seals WHERE user_id = $1 AND seal_id = $2',
      [userId, sealId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User does not have this seal' });
    }

    res.json({ message: `Seal removed from ${display_name}` });
  } catch (err) {
    console.error('Error removing seal:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
