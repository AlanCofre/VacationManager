const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../services/emailService');
const { renderTemplate } = require('../services/templateService');

exports.register = async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  const hash = await bcrypt.hash(password, 10);

  await db.query(
    'INSERT INTO users (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4)',
    [nombre, email, hash, rol]
  );

  res.json({ message: 'Usuario creado' });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en login' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No existe una cuenta con ese correo' });
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 30);

    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, expires, user.id]
    );

    const resetLink = `http://localhost:${process.env.PORT}/reset-password.html?token=${resetToken}`;

    const html = renderTemplate('resetPassword', {
      nombre: user.nombre,
      resetLink
    });

    await sendEmail(
      user.email,
      'Recuperación de contraseña - Vacation Manager',
      html
    );

    res.json({ message: 'Correo de recuperación enviado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar recuperación de contraseña' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Faltan datos para restablecer la contraseña' });
    }

    const result = await db.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires::timestamptz > CURRENT_TIMESTAMP',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const user = result.rows[0];
    const hash = await bcrypt.hash(password, 10);

    await db.query(
      `UPDATE users 
       SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL 
       WHERE id = $2`,
      [hash, user.id]
    );

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
};