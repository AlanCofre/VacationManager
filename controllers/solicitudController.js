const db = require('../config/db');
const sendEmail = require('../services/emailService');
const { renderTemplate } = require('../services/templateService');

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

  const [jefes] = await db.query(
    "SELECT email FROM users WHERE rol = 'JEFE'"
  );

  const [userRows] = await db.query('SELECT nombre FROM users WHERE id = ?', [user_id]);


  for (let jefe of jefes) {
    const html = renderTemplate('nuevaSolicitud', {
      nombre: userRows[0].nombre,
      fecha_inicio,
      fecha_fin,
      comentario
    });

    await sendEmail(
      jefe.email,
      "Nueva solicitud",
      html
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
    `SELECT u.email, u.nombre, s.fecha_inicio, s.fecha_fin
     FROM solicitudes s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ?`,
    [id]
  );

  const html = renderTemplate('solicitudAprobada', {
    nombre: rows[0].nombre,
    fecha_inicio: rows[0].fecha_inicio,
    fecha_fin: rows[0].fecha_fin
  });

  await sendEmail(
    rows[0].email,
    "Solicitud aprobada",
    html
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
    `SELECT u.email, u.nombre, s.fecha_inicio, s.fecha_fin
     FROM solicitudes s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ?`,
    [id]
  );

  const html = renderTemplate('solicitudRechazada', {
    nombre: rows[0].nombre,
    fecha_inicio: rows[0].fecha_inicio,
    fecha_fin: rows[0].fecha_fin,
    motivo
  });

  await sendEmail(
    rows[0].email,
    "Solicitud rechazada",
    html
  );

  res.json({ message: 'Rechazada' });
};