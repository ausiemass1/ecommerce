const mysql = require("mysql");
const db = mysql.createPool({
    connectionLimit: 100,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'webclass4'
})

module.exports = db;