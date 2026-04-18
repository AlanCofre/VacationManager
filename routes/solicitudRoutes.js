const express = require('express');
const router = express.Router();

const {
  listarSolicitudes,
  crearSolicitud,
  aprobarSolicitud,
  rechazarSolicitud
} = require('../controllers/solicitudController');

const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validateFechasSolicitud = require('../middlewares/validateFechasSolicitud');

router.get(
  '/',
  authenticateJWT,
  listarSolicitudes
);

router.post(
  '/',
  authenticateJWT,
  authorizeRoles('TRABAJADOR'),
  validateFechasSolicitud,
  crearSolicitud
);

router.put(
  '/:id/aprobar',
  authenticateJWT,
  authorizeRoles('JEFE'),
  aprobarSolicitud
);

router.put(
  '/:id/rechazar',
  authenticateJWT,
  authorizeRoles('JEFE'),
  rechazarSolicitud
);

module.exports = router;