var mysql = require('mysql2');
const db = mysql.createConnection({
    // connectionLimit : 10,
    host: 'localhost',
    user: 'admin',
    password: '123123',
    database: 'parking_system'
});

module.exports = db;