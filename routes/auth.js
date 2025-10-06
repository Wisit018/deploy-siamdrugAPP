const express = require('express');
const pool = require('../db');

const router = express.Router();

function trimValue(value) {
  return String(value || '').trim();
}

function normalizePnId(value) {
  return trimValue(value);
}

function normalizeOperator(value) {
  return trimValue(value);
}

function normalizeLevel(value) {
  return trimValue(value);
}

function toIsoDateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

// Render register form
router.get('/register', (req, res) => {
  res.render('auth/register', { error: null, values: {} });
});

// Handle register submission
router.post('/register', async (req, res, next) => {
  try {
    const { operator, pass, pn_id, source, level } = req.body;
    const values = { operator, pn_id, source, level };

    const operatorValue = normalizeOperator(operator);
    const pnIdValue = normalizePnId(pn_id);
    const levelValue = normalizeLevel(level) || 'employee';
    const passValue = trimValue(pass);
    const sourceIso = toIsoDateOrNull(source);

    if (!operatorValue || !pnIdValue || !levelValue || !passValue || !sourceIso) {
      return res.status(400).render('auth/register', { error: 'กรอกข้อมูลให้ครบทุกช่อง', values });
    }

    if (!/^\d{4}$/.test(passValue)) {
      return res.status(400).render('auth/register', { error: 'รหัสผ่านต้องเป็นตัวเลข 4 หลัก', values });
    }

    if (!/^\d{4}$/.test(pnIdValue)) {
      return res.status(400).render('auth/register', { error: 'รหัสพนักงานต้องเป็นตัวเลข 4 หลัก', values });
    }

    const [dup] = await pool.execute(
      'SELECT operator, pn_id FROM users WHERE operator = ? OR pn_id = ? LIMIT 1',
      [operatorValue, pnIdValue]
    );
    if (dup.length) {
      const conflict = dup[0];
      if (conflict.operator === operatorValue) {
        return res.status(400).render('auth/register', { error: 'ชื่อผู้ใช้งานนี้ถูกใช้แล้ว', values });
      }
      return res.status(400).render('auth/register', { error: 'รหัสพนักงานนี้ถูกใช้แล้ว', values });
    }

    const [result] = await pool.execute(
      'INSERT INTO users (operator, password_hash, pn_id, source, level) VALUES (?, ?, ?, ?, ?)',
      [operatorValue, passValue, pnIdValue, sourceIso, levelValue]
    );

    req.session.user = {
      id: result.insertId,
      operator: operatorValue,
      pn_id: pnIdValue,
      level: levelValue,
    };
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

// Render login form
router.get('/login', (req, res) => {
  const nextPath = typeof req.query.next === 'string' ? req.query.next : '';
  res.render('auth/login', { error: null, values: {}, nextPath });
});

// Handle login submission
router.post('/login', async (req, res, next) => {
  try {
    const { pn_id, pass } = req.body;
    const pnIdValue = normalizePnId(pn_id);
    const passValue = trimValue(pass);
    const nextPath = typeof req.query.next === 'string' ? req.query.next : '';
    const values = { pn_id: pnIdValue };

    if (!pnIdValue || !passValue) {
      return res.status(400).render('auth/login', {
        error: 'กรอกรหัสพนักงานและรหัสผ่าน',
        values,
        nextPath,
      });
    }

    const [rows] = await pool.execute(
      'SELECT id, operator, pn_id, password_hash, level FROM users WHERE pn_id = ? LIMIT 1',
      [pnIdValue]
    );
    if (!rows.length) {
      return res.status(401).render('auth/login', {
        error: 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง',
        values,
        nextPath,
      });
    }

    const user = rows[0];
    if (String(user.password_hash || '') !== passValue) {
      return res.status(401).render('auth/login', {
        error: 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง',
        values,
        nextPath,
      });
    }

    req.session.user = {
      id: user.id,
      operator: user.operator,
      pn_id: user.pn_id,
      level: user.level,
    };

    const safeNext = nextPath && nextPath !== '/login' ? nextPath : '/';
    res.redirect(safeNext);
  } catch (err) {
    next(err);
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
