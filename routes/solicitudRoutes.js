const express = require('express');
const router = express.Router();
const {
  listarSolicitudes,
  crearSolicitud,
  aprobarSolicitud,
  rechazarSolicitud
} = require('../controllers/solicitudController');

router.get('/', listarSolicitudes);
router.post('/', crearSolicitud);
router.put('/:id/aprobar', aprobarSolicitud);
router.put('/:id/rechazar', rechazarSolicitud);
module.exports = router;