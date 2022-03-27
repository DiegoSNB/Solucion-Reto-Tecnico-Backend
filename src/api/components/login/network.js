const express = require('express');
const response = require('../../../network/response');
const router = express.Router();

const controller = require('./controller');
const auth = require('../../../auth/auth');


router.post('/:tipo', controller.login);
router.get('/validar', auth.validate, controller.validar);
router.get('/id/:celular', controller.getID);
router.get('/validarPin/:celular/:pinSMS', controller.validarPin);
router.get('/rangoSucursal/:idUsuario', controller.rangoSucursal);
router.get('/validarDemo/:celular/:contrasena', controller.validarDemo);

module.exports = router;
