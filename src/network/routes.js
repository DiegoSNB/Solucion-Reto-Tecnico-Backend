const usuarios = require('../api/components/cuentas/network');
const indicador = require('../api/components/indicadores/network');
const login = require('../api/components/login/network');
const auth = require('../auth/auth');

const routes = (server) => {
  server.use('/usuarios',auth.check, usuarios);
  server.use('/indicadores',auth.check, indicador);
  server.use('/login',login);
};

module.exports = routes;
