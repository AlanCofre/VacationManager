require('dotenv').config();
const express = require('express');
const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

/* =========================
   TEST CONEXIÓN
========================= */
app.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1');
    res.json({ message: 'Servidor OK', db: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   REGISTRO (rápido para pruebas)
========================= */
app.post('/auth/register', async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    const hash = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO users (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, hash, rol]
    );

    res.json({ message: 'Usuario creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   LOGIN
========================= */
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   CREAR SOLICITUD
========================= */
app.post('/solicitudes', async (req, res) => {
  try {
    const { user_id, fecha_inicio, fecha_fin, comentario } = req.body;

    await db.query(
      `INSERT INTO solicitudes 
      (user_id, fecha_inicio, fecha_fin, comentario)
      VALUES (?, ?, ?, ?)`,
      [user_id, fecha_inicio, fecha_fin, comentario]
    );

    res.json({ message: 'Solicitud creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   VER SOLICITUDES
========================= */
app.get('/solicitudes', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM solicitudes');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   APROBAR
========================= */
app.put('/solicitudes/:id/aprobar', async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE solicitudes 
       SET estado = 'APROBADA', fecha_resolucion = NOW()
       WHERE id = ?`,
      [id]
    );

    res.json({ message: 'Solicitud aprobada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   RECHAZAR
========================= */
app.put('/solicitudes/:id/rechazar', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    await db.query(
      `UPDATE solicitudes 
       SET estado = 'RECHAZADA', motivo_rechazo = ?, fecha_resolucion = NOW()
       WHERE id = ?`,
      [motivo, id]
    );

    res.json({ message: 'Solicitud rechazada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   START SERVER
========================= */
app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en puerto ${process.env.PORT}`);
});