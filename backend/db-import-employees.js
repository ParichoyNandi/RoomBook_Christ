// import-employees.js
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');

const db = new sqlite3.Database(path.resolve(__dirname, 'seat_booking_system.db'));

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  fs.createReadStream('Employee_data.csv')
    .pipe(csv())
    .on('data', (row) => {
      const { id, name, designation, department } = row;
      db.run(
        `INSERT OR IGNORE INTO employees (id, name, designation, department) VALUES (?, ?, ?, ?)`,
        [id, name, designation, department],
        (err) => {
          if (err) console.error('Insert error:', err.message);
        }
      );
    })
    .on('end', () => {
      console.log('CSV import completed.');
      db.close();
    });
});
