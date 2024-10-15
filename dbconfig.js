var mysql = require("mysql");
var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'webclass4'
})

conn.connect((err)=>{
    if(err) throw err;
    console.log("connection to database was successful");
});

module.exports = conn;