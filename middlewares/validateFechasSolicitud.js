const isValidDate = (dateStr) => {
  // Formato estricto YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

const parseToUTC = (dateStr) => {
  const [year, month, day] = dateStr.split("-");
  return new Date(Date.UTC(year, month - 1, day));
};

const validateFechasSolicitud = (req, res, next) => {
  const { fecha_inicio, fecha_fin } = req.body;

  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({
      error: "fecha de inicio y fecha de fin son obligatorias"
    });
  }

  if (typeof fecha_inicio !== "string" || typeof fecha_fin !== "string") {
    return res.status(400).json({
      error: "Las fechas deben ser estar en formato YYYY-MM-DD"
    });
  }

  if (!isValidDate(fecha_inicio) || !isValidDate(fecha_fin)) {
    return res.status(400).json({
      error: "Formato de fecha inválido. Usa YYYY-MM-DD"
    });
  }

  const inicio = parseToUTC(fecha_inicio);
  const fin = parseToUTC(fecha_fin);

  const hoy = new Date();
  const hoyUTC = new Date(Date.UTC(
    hoy.getUTCFullYear(),
    hoy.getUTCMonth(),
    hoy.getUTCDate()
  ));

  if (inicio > fin) {
    return res.status(400).json({
      error: "fecha de inicio no puede ser mayor que fecha de fin"
    });
  }

  if (inicio < hoyUTC) {
    return res.status(400).json({
      error: "fecha de inicio no puede estar en el pasado"
    });
  }

  req.body.fecha_inicio = fecha_inicio;
  req.body.fecha_fin = fecha_fin;

  next();
};

module.exports = validateFechasSolicitud;