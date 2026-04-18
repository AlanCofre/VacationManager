const db = require('../config/db');
const sendEmail = require('../services/emailService');
const { renderTemplate } = require('../services/templateService');

exports.listarSolicitudes = async (req, res) => {
  try {
    let rows;

    if (req.user.rol === 'JEFE') {
      [rows] = await db.query(`
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
    } else {
      [rows] = await db.query(`
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
        WHERE s.user_id = ?
        ORDER BY s.fecha_creacion DESC
      `, [req.user.id]);
    }

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
      const htmlJefe = renderTemplate('nuevaSolicitud', {
        nombre: usuario.nombre,
        fecha_inicio,
        fecha_fin,
        comentario
      });

      await sendEmail(
        jefe.email,
        'Nueva solicitud',
        htmlJefe
      );
    }

    const htmlTrabajador = renderTemplate('solicitudEnviada', {
      nombre: usuario.nombre,
      fecha_inicio,
      fecha_fin,
      comentario
    });

    await sendEmail(
      usuario.email,
      'Solicitud enviada con éxito',
      htmlTrabajador
    );

    res.json({ message: 'Solicitud creada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la solicitud' });
  }
};

exports.aprobarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `UPDATE solicitudes
       SET estado = 'APROBADA', fecha_resolucion = NOW()
       WHERE id = ? AND estado = 'PENDIENTE'`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        error: 'La solicitud no existe o ya fue procesada'
      });
    }

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

    const [result] = await db.query(
      `UPDATE solicitudes
       SET estado = 'RECHAZADA', motivo_rechazo = ?, fecha_resolucion = NOW()
       WHERE id = ? AND estado = 'PENDIENTE'`,
      [motivo, id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        error: 'La solicitud no existe o ya fue procesada'
      });
    }

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