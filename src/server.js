const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const debug = require('debug')('app:server');
const errors = require('./network/errors');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(bodyParser.json());

const router = require('./network/routes');
router(app);

app.use(errors);

const server = app.listen(process.env.PORT, () => {
  debug(`Listening http://localhost:${server.address().port}`);
});
