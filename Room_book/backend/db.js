// db.js
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',          
  password: '6297',  
  database: 'seat_booking_system'
});

module.exports = pool.promise();
