const db = require('../config/db');
const sendEmail = require('../services/emailService');
const { renderTemplate } = require('../services/templateService');

exports.listarSolicitudes = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.id,
        s.user_id,
        s.fecha_inicio,
        s.fecha_fin,
        s.estado,
        s.comentario,
        s.motivo_rechazo,
        s.fecha_creacion,
        s.fecha_resolucion,
        s.resuelto_por,
        u.nombre,
        u.email,
        u.rol
      FROM solicitudes s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.fecha_creacion DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar solicitudes' });
  }
};

exports.crearSolicitud = async (req, res) => {
  try {
    const { user_id, fecha_inicio, fecha_fin, comentario } = req.body;

    await db.query(
      `INSERT INTO solicitudes (user_id, fecha_inicio, fecha_fin, comentario)
       VALUES (?, ?, ?, ?)`,
      [user_id, fecha_inicio, fecha_fin, comentario]
    );

    const [jefes] = await db.query(
      "SELECT email FROM users WHERE rol = 'JEFE'"
    );

    const [userRows] = await db.query(
      'SELECT nombre FROM users WHERE id = ?',
      [user_id]
    );

    for (let jefe of jefes) {
      const html = renderTemplate('nuevaSolicitud', {
        nombre: userRows[0].nombre,
        fecha_inicio,
        fecha_fin,
        comentario
      });

      await sendEmail(
        jefe.email,
        'Nueva solicitud',
        html
      );
    }

    res.json({ message: 'Solicitud creada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la solicitud' });
  }
};

exports.aprobarSolicitud = async (req, res) => {
  try {
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
      'Solicitud aprobada',
      html
    );

    res.json({ message: 'Aprobada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al aprobar la solicitud' });
  }
};

exports.rechazarSolicitud = async (req, res) => {
  try {
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
      'Solicitud rechazada',
      html
    );

    res.json({ message: 'Rechazada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al rechazar la solicitud' });
  }
};