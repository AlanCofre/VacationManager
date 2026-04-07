const db = require('../config/db');
const sendEmail = require('../services/emailService');

exports.listarSolicitudes = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM solicitudes');
  res.json(rows);
};

exports.crearSolicitud = async (req, res) => {
  const { user_id, fecha_inicio, fecha_fin, comentario } = req.body;

  await db.query(
    `INSERT INTO solicitudes (user_id, fecha_inicio, fecha_fin, comentario)
     VALUES (?, ?, ?, ?)`,
    [user_id, fecha_inicio, fecha_fin, comentario]
  );

  // obtener todos los jefes
  const [jefes] = await db.query(
    "SELECT email FROM users WHERE rol = 'JEFE'"
  );

  // enviar a todos
  for (let jefe of jefes) {
    await sendEmail(
      jefe.email,
      "Nueva solicitud",
      "Hay una nueva solicitud pendiente"
    );
  }

  res.json({ message: 'Solicitud creada' });
};

exports.aprobarSolicitud = async (req, res) => {
  const { id } = req.params;

  await db.query(
    `UPDATE solicitudes 
     SET estado = 'APROBADA', fecha_resolucion = NOW()
     WHERE id = ?`,
    [id]
  );

  const [rows] = await db.query(
    `SELECT u.email 
     FROM solicitudes s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ?`,
    [id]
  );

  await sendEmail(
    rows[0].email,
    "Solicitud aprobada",
    "Tu solicitud fue aprobada"
  );

  res.json({ message: 'Aprobada' });
};

exports.rechazarSolicitud = async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  await db.query(
    `UPDATE solicitudes 
     SET estado = 'RECHAZADA', motivo_rechazo = ?, fecha_resolucion = NOW()
     WHERE id = ?`,
    [motivo, id]
  );

  const [rows] = await db.query(
    `SELECT u.email 
     FROM solicitudes s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ?`,
    [id]
  );

  await sendEmail(
    rows[0].email,
    "Solicitud rechazada",
    `Tu solicitud fue rechazada. Motivo: ${motivo}`
  );

  res.json({ message: 'Rechazada' });
};

