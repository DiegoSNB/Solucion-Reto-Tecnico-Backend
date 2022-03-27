const mysql = require('mysql2');
const { promisify } = require('util');
require('dotenv').config();

const dbconf = {
    host:'localhost',
    user: 'root',
    password: '',
    database: 'reto_tecnico',
   
  };

const pool = mysql.createPool(dbconf);

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error para conectar la base de datos');
        console.error(err);
        return err;
    }

    if (connection)
        connection.release();
    console.log("BD Conexión exitosa");
    return;

   
})

pool.query('SELECT * FROM usuarios', (err,rows)=>{
    if(err) throw err 
    console.log('los datos son');
    console.log(rows);
})


pool.query = promisify(pool.query);

module.exports = pool;

