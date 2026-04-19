const db = require('../config/db');
const sendEmail = require('../services/emailService');
const { renderTemplate } = require('../services/templateService');

exports.listarSolicitudes = async (req, res) => {
  try {
    const { tipo } = req.query;

    let query = `
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
    `;

    const conditions = [];
    const params = [];

    if (req.user.rol !== 'JEFE') {
      conditions.push('s.user_id = $' + (params.length + 1));
      params.push(req.user.id);
    }

    if (tipo === 'pendientes') {
      conditions.push(`s.estado = 'PENDIENTE'`);
    } else if (tipo === 'resueltas') {
      conditions.push(`s.estado IN ('APROBADA', 'RECHAZADA', 'CANCELADA')`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.fecha_creacion DESC';

    const result = await db.query(query, params);

    res.json(result.rows);
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

    const resultUsuarios = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [user_id]
    );

    if (resultUsuarios.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuario = resultUsuarios.rows[0];

    const resultExistentes = await db.query(
      `SELECT * FROM solicitudes 
       WHERE user_id = $1 AND estado = 'PENDIENTE'`,
      [user_id]
    );

    if (resultExistentes.rows.length > 0) {
      return res.status(400).json({ error: 'Ya tienes una solicitud pendiente' });
    }

    const resultSolapadas = await db.query(`
      SELECT id FROM solicitudes
      WHERE user_id = $1
      AND estado IN ('PENDIENTE', 'APROBADA')
      AND (
        fecha_inicio <= $2
        AND fecha_fin >= $3
      )
      LIMIT 1
    `, [user_id, fecha_fin, fecha_inicio]);

    if (resultSolapadas.rows.length > 0) {
      return res.status(400).json({
        error: 'Ya tienes solicitudes en ese rango de fechas'
      });
    }

    await db.query(
      `INSERT INTO solicitudes (user_id, fecha_inicio, fecha_fin, comentario)
       VALUES ($1, $2, $3, $4)`,
      [user_id, fecha_inicio, fecha_fin, comentario]
    );

    const resultJefes = await db.query(
      "SELECT email FROM users WHERE rol = 'JEFE'"
    );

    for (let jefe of resultJefes.rows) {
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
    const user = req.user;

    const result = await db.query(
      `UPDATE solicitudes
       SET estado = 'APROBADA', 
           fecha_resolucion = NOW(),
           resuelto_por = $1
       WHERE id = $2 AND estado = 'PENDIENTE'`,
      [user.id, parseInt(id)]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        error: 'La solicitud no existe o ya fue procesada'
      });
    }

    const resultRows = await db.query(
      `SELECT u.email, u.nombre, s.fecha_inicio, s.fecha_fin
       FROM solicitudes s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1`,
      [parseInt(id)]
    );

    const jefeResult = await db.query(
      'SELECT nombre, email FROM users WHERE id = $1',
      [user.id]
    );

    const htmlTrabajador = renderTemplate('solicitudAprobada', {
      nombre: resultRows.rows[0].nombre,
      fecha_inicio: resultRows.rows[0].fecha_inicio,
      fecha_fin: resultRows.rows[0].fecha_fin
    });

    await sendEmail(
      resultRows.rows[0].email,
      'Solicitud aprobada',
      htmlTrabajador
    );

    const htmlJefe = renderTemplate('jefeResolviste', {
      nombreJefe: jefeResult.rows[0].nombre,
      accion: 'aprobado',
      nombreEmpleado: resultRows.rows[0].nombre,
      fechaInicio: resultRows.rows[0].fecha_inicio,
      fechaFin: resultRows.rows[0].fecha_fin,
      estado: 'APROBADA'
    });

    await sendEmail(
      jefeResult.rows[0].email,
      'Solicitud resuelta',
      htmlJefe
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
    const user = req.user;

    const result = await db.query(
      `UPDATE solicitudes
       SET estado = 'RECHAZADA', 
           motivo_rechazo = $1, 
           fecha_resolucion = NOW(),
           resuelto_por = $2
       WHERE id = $3 AND estado = 'PENDIENTE'`,
      [motivo, user.id, parseInt(id)]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        error: 'La solicitud no existe o ya fue procesada'
      });
    }

    const resultRows = await db.query(
      `SELECT u.email, u.nombre, s.fecha_inicio, s.fecha_fin
       FROM solicitudes s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1`,
      [parseInt(id)]
    );

    const jefeResult = await db.query(
      'SELECT nombre, email FROM users WHERE id = $1',
      [user.id]
    );

    const htmlTrabajador = renderTemplate('solicitudRechazada', {
      nombre: resultRows.rows[0].nombre,
      fecha_inicio: resultRows.rows[0].fecha_inicio,
      fecha_fin: resultRows.rows[0].fecha_fin,
      motivo
    });

    await sendEmail(
      resultRows.rows[0].email,
      'Solicitud rechazada',
      htmlTrabajador
    );

    const htmlJefe = renderTemplate('jefeResolviste', {
      nombreJefe: jefeResult.rows[0].nombre,
      accion: 'rechazado',
      nombreEmpleado: resultRows.rows[0].nombre,
      fechaInicio: resultRows.rows[0].fecha_inicio,
      fechaFin: resultRows.rows[0].fecha_fin,
      estado: 'RECHAZADA'
    });

    await sendEmail(
      jefeResult.rows[0].email,
      'Solicitud resuelta',
      htmlJefe
    );

    res.json({ message: 'Rechazada' });

  } catch (error) {
    res.status(500).json({ error: 'Error al rechazar la solicitud' });
  }
};