const LOGIN = require('./model');
const store = require('../../../store/mysql');
const response = require('../../../network/response');
const auth = require('../../../auth/auth');
const request = require('request');

const validar = (req, res, next) => {
  response.success(req, res, 'Correcto, Token Valido', 200);
};

const login = async (req, res, next) => {
  if (req.params.tipo === 'usuario') {
    loginUsuario(req, res);
  } else if (req.params.tipo === 'oficial') {
    loginOficial(req, res);
  } else if (req.params.tipo === 'administracion') {
    loginAdministracion(req, res);
  }
};

const getID = async (req, res) => {
  try {
    objeto = await store.custom(
      `SELECT ID FROM usuarios WHERE NUM_CELULAR = '${req.params.celular}'`
    );
    respuesta = objeto[0].ID;

    response.success(req, res, respuesta, 200);
  } catch (error) {
    response.error(req, res, 'Problema al procesar la petición', 400);
  }
};

const enviarSMS = async (pin, celular) => {
  try {
    targetURL = 'https://api.smsmasivos.com.mx/sms/send';

    respuesta = request.post(
      {
        url: targetURL,
        headers: {
          //apikey: 'f28150e622dbb76b3560dd19af5ecbc42a26946c', //APIKey AccendoSaion
          //apikey: '7cd451cc8f6eb3c44774e4cd220cc7d8ea4762b0', //APIKey Memo
          apikey: 'ce26c7909dfa7e465877b7b7b977219d5082e0f9', //APIKey Vicente
        },
        form: {
          message: `Saion: Tu codigo es ${pin} capturalo en la aplicacion para completar tu inicio de sesion.`,
          numbers: celular,
          country_code: 52,
        },
      },
      (err, res, body) => {
        if (err == null) {
          console.log(body);
        }
      }
    );
    console.log('Envio de SMS OK. Pin:' + pin + ', Celular:' + celular);
    //response.success(req,res,respuesta, 200);
  } catch (error) {
    // response.error(req,res,'Problema al procesar la petición', 400);
    console.log('Fallo en envio SMS');
  }
};

const validarPin = async (req, res) => {
  respuesta = false;
  try {
    //Validamos celular  y pin en BD
    objeto = await store.custom(
      `SELECT ID FROM usuarios WHERE DES_PIN_SMS = ${req.params.pinSMS} AND NUM_CELULAR = '${req.params.celular}'`
    );

    const token = auth.createTokenUsuario(objeto[0]);

    response.success(req, res, token, 200);
  } catch (error) {
    response.error(req, res, 'Pin incorrecto', 400);
  }
};

const loginUsuario = async (req, res) => {
  const celular = req.body.celular;
  if (celular !== undefined) {
    try {
      usuario = await store.custom(
        `SELECT * FROM usuarios WHERE NUM_CELULAR = ${celular}`
      );
      if ((Object.keys(usuario).length == 0) == false) {
        //Si el usuario existe
        let usuarioExistente = new Boolean(true);

        //Validar inicios de sesion en la ultima hora
        contInicioSesion = 0;
        try {
          inicioSesion = await store.custom(
            `SELECT * FROM meta_usuarios WHERE DES_META_KEY = 'NUM_INICIO_SESION' AND ID_USUARIO = ${usuario[0].ID}`
          );

          horaUltimoInicioSesion = new Date(
            inicioSesion[0].FECHA
          ).toLocaleTimeString('en-GB');
          fechaUltimoInicioSesion = new Date(inicioSesion[0].FECHA);
          year = fechaUltimoInicioSesion.getFullYear();
          month = fechaUltimoInicioSesion.getMonth() + 1;
          day = fechaUltimoInicioSesion.getDate();

          //Guardamos la fecha ultimo inicio de sesion
          fechaUltimoInicioSesion =
            year + '-' + month + '-' + day + ' ' + horaUltimoInicioSesion;

          inicioSesion = inicioSesion[0].DES_META_VALUE;

          horaPosterior = await store.custom(
            `SELECT DATE_ADD('${fechaUltimoInicioSesion}',INTERVAL 1 HOUR) AS horaPosterior`
          );
          fechaPosterior = new Date(horaPosterior[0].horaPosterior);
          fechaUltimoInicioSesion = new Date(fechaUltimoInicioSesion);

          fechaActual = await store.custom(`SELECT NOW() AS hoy`);
          fechaActual = new Date(fechaActual[0].hoy);

          console.log(fechaPosterior);
          console.log(fechaUltimoInicioSesion);

          if (fechaPosterior > fechaActual) {
            contInicioSesion = parseInt(inicioSesion) + 1;
            //Actualizamos contador
            await store.custom(
              `UPDATE meta_usuarios SET DES_META_VALUE = ${contInicioSesion} WHERE DES_META_KEY = 'NUM_INICIO_SESION' AND ID_USUARIO = ${usuario[0].ID} AND ESTATUS = 1`
            );
          } else {
            //Actualizamos contador y hora de registro
            fechaActual = await store.custom(`SELECT NOW() AS hoy`);
            fecha = new Date(fechaActual[0].hoy);
            year = fecha.getFullYear();
            month = fecha.getMonth() + 1;
            day = fecha.getDate();

            hora = new Date(fechaActual[0].hoy).toLocaleTimeString('en-GB');

            fechaActualCompleta = year + '-' + month + '-' + day + ' ' + hora;

            await store.custom(
              `UPDATE meta_usuarios SET DES_META_VALUE = 0, FECHA = '${fechaActualCompleta}' WHERE DES_META_KEY = 'NUM_INICIO_SESION' AND ID_USUARIO = ${usuario[0].ID} AND ESTATUS = 1`
            );
          }
        } catch (err) {
          //En caso de no existir crea el registro
          await store.custom(
            `INSERT INTO meta_usuarios (DES_META_KEY,DES_META_VALUE,ID_USUARIO) VALUES ('NUM_INICIO_SESION',0,${usuario[0].ID})`
          );
        }

        console.log(contInicioSesion);

        if (contInicioSesion < 4) {
          //Si se ha iniciado mas de las sesiones permitidas por hora

          //Actualizamos pin de inicio de sesion en BD
          //pin = parseInt(Math.random() * (9999 - 1000) + 1000);
          fecha = await store.custom(`SELECT NOW() AS fechaActual`);
          fecha = fecha[0].fechaActual;
          fecha = new Date(fecha);
          millisFecha = (fecha / 1000).toString();
          pin = '';
          pin += millisFecha[millisFecha.length - 6];
          pin += millisFecha[millisFecha.length - 5];
          pin += millisFecha[millisFecha.length - 4];
          pin += millisFecha[millisFecha.length - 3];
          pin += millisFecha[millisFecha.length - 2];
          pin += millisFecha[millisFecha.length - 1];

          await store.custom(
            `UPDATE usuarios SET DES_PIN_SMS = ${pin} WHERE NUM_CELULAR = ${celular}`
          );

          //Enviamos SMS
          //await enviarSMS(pin, celular);

          //Revisar si se llenaron los campos de la cuenta
          checkUsuario = await store.custom(
            `SELECT DES_NOMBRE FROM usuarios WHERE NUM_CELULAR = ${celular}`
          );

          if (checkUsuario[0].DES_NOMBRE === 'nuevo') {
            let usuarioExistenteVacio = new Boolean(false);
            response.success(req, res, usuarioExistenteVacio, 200);
          }

          response.success(req, res, usuarioExistente, 200);
        } else {
          //Si se ha excedido el limite de inicios de sesion por hora

          response.error(req, res, 'Inicios de sesion por hora excedidos', 401);
        }
      } else {
        //Si el usuario no existe
        let usuarioNoExistente = new Boolean(false);

        //Creamos usuario
        //pin = parseInt(Math.random() * (9999 - 1000) + 1000);
        fecha = await store.custom(`SELECT NOW() AS fechaActual`);
        fecha = fecha[0].fechaActual;
        fecha = new Date(fecha);
        millisFecha = (fecha / 1000).toString();
        pin = '';
        pin += millisFecha[millisFecha.length - 6];
        pin += millisFecha[millisFecha.length - 5];
        pin += millisFecha[millisFecha.length - 4];
        pin += millisFecha[millisFecha.length - 3];
        pin += millisFecha[millisFecha.length - 2];
        pin += millisFecha[millisFecha.length - 1];
        await store.custom(
          `INSERT INTO usuarios (NUM_CELULAR,DES_CORREO,DES_NOMBRE,DES_APELLIDO_PATERNO,DES_APELLIDO_MATERNO,DES_CONTRASENA,DES_PIN_SMS,NUM_SALDO) VALUES (${celular},'nuevo','nuevo','nuevo','nuevo','nuevo',${pin},20)`
        );

        //Enviamos SMS
        //await enviarSMS(pin, celular);

        response.success(req, res, usuarioNoExistente, 200);
      }
    } catch (err) {
      response.error(req, res, 'Error en consulta de datos', 400);
    }
  } else {
    response.error(req, res, 'Datos de celular inexistentes', 500);
  }
};

const loginOficial = async (req, res) => {
  const celular = req.body.celular;

  if (celular !== undefined) {
    try {
      usuario = await store.custom(
        `SELECT * FROM usuarios WHERE NUM_CELULAR = ${celular} AND ESTATUS = 1`
      );
      idUsuario = usuario[0].ID;
      if ((Object.keys(usuario).length == 0) == false) {
        //Si el usuario existe
        let usuarioExistente = new Boolean(true);

        try {
          //Revisamos si usuario tiene rango de oficial
          checador = await store.custom(
            `SELECT * FROM meta_usuarios WHERE DES_META_KEY = 'BND_OFICIAL' AND DES_META_VALUE = 1 AND ID_USUARIO = ${idUsuario}`
          );
          chechador = checador[0].ID_USUARIO;

          //Actualizamos pin de inicio de sesion en BD
          fecha = await store.custom(`SELECT NOW() AS fechaActual`);
          fecha = fecha[0].fechaActual;
          fecha = new Date(fecha);
          millisFecha = (fecha / 1000).toString();
          pin = '';
          pin += millisFecha[millisFecha.length - 6];
          pin += millisFecha[millisFecha.length - 5];
          pin += millisFecha[millisFecha.length - 4];
          pin += millisFecha[millisFecha.length - 3];
          pin += millisFecha[millisFecha.length - 2];
          pin += millisFecha[millisFecha.length - 1];
          await store.custom(
            `UPDATE usuarios SET DES_PIN_SMS = ${pin} WHERE NUM_CELULAR = ${celular}`
          );

          //Enviamos SMS
          //await enviarSMS(pin, celular);

          response.success(req, res, usuarioExistente, 200);
        } catch (err) {
          //Usuario no tiene rango de oficial
          response.error(req, res, 'El usuario no tiene rango de oficial', 404);
        }
      }
    } catch (err) {
      response.error(req, res, 'Usuario para el oficial inexistente', 400);
    }
  } else {
    response.error(req, res, 'Datos de celular inexistentes', 500);
  }
};

const loginAdministracion = async (req, res) => {
  const correo = req.body.correo;
  const contrasena = req.body.contrasena;
  datos: any = [];

  if (correo !== undefined && contrasena !== undefined) {
    store
      .loginAdministracion(correo, contrasena)
      .then((respuesta) => {
        if ((Object.keys(respuesta).length == 0) == false) {
          //Evitar generar token con contraseña incorrecta

          const token = auth.createToken(correo[0]);

          response.success(req, res, token, 200);
        } else {
          response.error(req, res, 'Correo/Contraseña incorrectos', 500);
        }
      })
      .catch(next);
  } else {
    response.error(req, res, 'Datos incorrectos', 500);
  }
};

const rangoSucursal = async (req, res) => {
  idUsuario = req.params.idUsuario;

  try {
    try {
      //Validamos rango sucursal
      objeto = await store.custom(
        `SELECT * FROM meta_usuarios WHERE DES_META_KEY = 'BND_SUCURSAL' AND DES_META_VALUE = 1 AND ID_USUARIO = ${idUsuario}`
      );
      id = objeto[0].ID;
    } catch (err) {
      response.success(req, res, 'false', 200);
    }

    response.success(req, res, 'true', 200);
  } catch (error) {
    response.error(req, res, 'Problema al procesar la peticion', 400);
  }
};

const validarDemo = async (req, res) => {
  celular = req.params.celular;
  contrasena = req.params.contrasena;

  try {
    //Validamos celular  y contrasena en BD
    objeto = await store.custom(
      `SELECT ID FROM usuarios WHERE DES_CONTRASENA = '${contrasena}' AND NUM_CELULAR = '${celular}'`
    );

    const token = auth.createTokenUsuario(objeto[0]);

    response.success(req, res, token, 200);
  } catch (error) {
    response.error(req, res, 'Pin incorrecto', 400);
  }
};

module.exports = {
  login,
  validar,
  getID,
  validarPin,
  validarDemo,
  rangoSucursal,
};
