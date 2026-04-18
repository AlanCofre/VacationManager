const db = require('../config/db');
const sendEmail = require('../services/emailService');
const { renderTemplate } = require('../services/templateService');

exports.listarSolicitudes = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, u.nombre, u.email, u.rol
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
    const user_id = req.user.id;   
    const { fecha_inicio, fecha_fin, comentario } = req.body;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const [usuarios] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [user_id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuario = usuarios[0];

    const [existentes] = await db.query(
      `SELECT * FROM solicitudes 
       WHERE user_id = ? AND estado = 'PENDIENTE'`,
      [user_id]
    );

    if (existentes.length > 0) {
      return res.status(400).json({ error: 'Ya tienes una solicitud pendiente' });
    }

    await db.query(
      `INSERT INTO solicitudes (user_id, fecha_inicio, fecha_fin, comentario)
       VALUES (?, ?, ?, ?)`,
      [user_id, fecha_inicio, fecha_fin, comentario]
    );

    const [jefes] = await db.query(
      "SELECT email FROM users WHERE rol = 'JEFE'"
    );

    for (let jefe of jefes) {
      const html = renderTemplate('nuevaSolicitud', {
        nombre: usuario.nombre,
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
    res.status(500).json({ error: 'Error al crear solicitud' });
  }
};

exports.aprobarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;

    const [solicitudes] = await db.query(
      'SELECT * FROM solicitudes WHERE id = ?',
      [id]
    );

    if (solicitudes.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (solicitudes[0].estado !== 'PENDIENTE') {
      return res.status(400).json({ error: 'Solo se pueden aprobar solicitudes pendientes' });
    }

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
    res.status(500).json({ error: 'Error al aprobar solicitud' });
  }
};

exports.rechazarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const [solicitudes] = await db.query(
      'SELECT * FROM solicitudes WHERE id = ?',
      [id]
    );

    if (solicitudes.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (solicitudes[0].estado !== 'PENDIENTE') {
      return res.status(400).json({ error: 'Solo se pueden rechazar solicitudes pendientes' });
    }

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
    res.status(500).json({ error: 'Error al rechazar solicitud' });
  }
};