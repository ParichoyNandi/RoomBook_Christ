// setup-db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'seat_booking_system.db'));

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  db.run(`CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    designation TEXT,
    department TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    day TEXT,
    time_slot TEXT,
    seat_number INTEGER,
    week_start TEXT,
    booking_date TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE (day, time_slot, seat_number, week_start)
  )`);

  console.log('Tables created or already exist.');
});

db.close();
