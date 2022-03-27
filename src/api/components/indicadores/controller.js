const INDICADOR = require('./model');
const store = require('../../../store/mysql');
const response = require('../../../network/response');
const request = require('request');

const list = async (req, res) => {
  let thelist = null;
  try {
    thelist = await store.list(INDICADOR.TABLA);
    response.success(req, res, thelist, 200);
  } catch (error) {
    response.error(req, res, 'Problema al procesar la petición', 400);
  }
};

const count = async (req, res) => {
  let total = null;
  try {
    total = await store.count(INDICADOR.TABLA, INDICADOR.Nombre);
    response.success(req, res, total, 200);
  } catch (error) {
    response.error(req, res, 'Problema al procesar la petición', 400);
  }
};

const get = async (req, res) => {
  let objeto = null;
  if (req.params.id) {
    if (req.params.id !== '') {
      try {
        objeto = await store.get(INDICADOR.TABLA, req.params.id);
        response.success(req, res, objeto, 200);
      } catch (error) {
        response.error(req, res, 'Problema al procesar la petición', 400);
      }
    } else {
      response.error(req, res, 'El id no puede estár vacío', 400);
    }
  } else {
    response.error(req, res, 'No se ha recibido un campo id', 400);
  }
};

const insert = async (req, res) => {
  let objeto = null;

  if (
   
    req.body.Nombre !== null &&
    req.body.Nombre !== undefined &&
    req.body.Nombre !== '' &&
    req.body.Cantidad !== null &&
    req.body.Cantidad !== undefined &&
    req.body.Cantidad !== '' 
   
  ) {
    try {
      objeto = await store.insert(INDICADOR.TABLA, req.body);
      response.success(req, res, objeto, 200);
    } catch (error) {
      response.error(req, res, 'Problema al procesar la petición', 400);
    }
  } else {
    response.error(req, res, 'No se han recibido todos los datos', 400);
  }
};

const update = async (req, res) => {
  let objeto = null;
  if (req.body !== '') {
    if (
      req.body.ID !== null &&
      req.body.ID !== undefined &&
      req.body.ID !== ''
    ) {
      try {
        objeto = await store.update(INDICADOR.TABLA, req.body);
        response.success(req, res, objeto, 200);
      } catch (error) {
        response.error(req, res, 'Problema al procesar la petición', 400);
      }
    } else {
      response.error(req, res, 'No hay un campo id a actualizar', 400);
    }
  } else {
    response.error(req, res, 'No se han recibido datos', 400);
  }
};

const remove = async (req, res) => {
  let objeto = null;
  if (req.params.id !== '') {
    try {
      objeto = await store.remove(INDICADOR.TABLA, req.params.id);
      response.success(req, res, objeto, 200);
    } catch (error) {
      response.error(req, res, 'Problema al procesar la petición', 400);
    }
  } else {
    response.error(req, res, 'No se ha recibido id', 400);
  }
};

const search = async (req, res) => {
  let body = req.body;
  let params = req.params;
  let objeto = null;
  if (body !== '') {
    if (params.columName && params.value) {
      try {
        objeto = await store.search(
          INDICADOR.TABLA,
          params.columName,
          params.value,
          'contains'
        );
        response.success(req, res, objeto, 200);
      } catch (error) {
        response.error(req, res, 'Problema al procesar la petición', 400);
      }
    } else {
      response.error(
        req,
        res,
        'No se ha ingresado columna o valor a buscar',
        400
      );
    }
  } else {
    response.error(req, res, 'No se han recibido datos', 400);
  }
};



module.exports = {
  list,
  get,
  insert,
  update,
  remove,
  count,
  search,
 
};
