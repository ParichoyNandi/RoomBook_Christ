const express = require('express');
const router = express.Router();
const db = require('./db-helpers');

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day;
  const sunday = new Date(now.setDate(diff));
  sunday.setHours(0, 0, 0, 0);
  return sunday.toISOString().split('T')[0];
}

// ✅ GET available seats
router.get('/seats', async (req, res) => {
  const { booking_date, time } = req.query;
  try {
    const rows = await db.all(
      'SELECT seat_number FROM bookings WHERE booking_date = ? AND time_slot = ?',
      [booking_date, time]
    );
    const bookedSeats = rows.map(r => r.seat_number);
    res.json({ bookedSeats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ POST book a seat
router.post('/book', async (req, res) => {
  const { employeeId, seatNumber, booking_date, time } = req.body;

  if (!booking_date || !/^\d{4}-\d{2}-\d{2}$/.test(booking_date)) {
    return res.status(400).json({ message: 'Invalid or missing booking_date' });
  }

  const bookingDateObj = new Date(booking_date);
  const dayOfWeek = bookingDateObj.getDay();
  const sunday = new Date(bookingDateObj);
  sunday.setDate(bookingDateObj.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);
  const weekStart = sunday.toISOString().split('T')[0];
  const day = bookingDateObj.toLocaleDateString('en-US', { weekday: 'long' });

  try {
    const emp = await db.get("SELECT * FROM employees WHERE id = ?", [employeeId]);
    if (!emp) return res.status(400).json({ message: 'Invalid Employee ID' });

    const existing = await db.get(
      "SELECT * FROM bookings WHERE seat_number = ? AND booking_date = ? AND time_slot = ?",
      [seatNumber, booking_date, time]
    );
    if (existing) return res.status(400).json({ message: 'Seat already booked' });

    await db.run(
      `INSERT INTO bookings (employee_id, seat_number, day, time_slot, week_start, booking_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employeeId, seatNumber, day, time, weekStart, booking_date]
    );

    res.json({ message: 'Booking successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

// ✅ GET admin bookings
router.get('/admin/bookings', async (req, res) => {
  const range = req.query.range || 'week';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  let dateCondition = '';
  let dateValue = [];

  switch (range) {
    case 'today':
      dateCondition = `WHERE b.booking_date = ?`;
      dateValue = [todayStr];
      break;
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - weekStart.getDay());
      dateCondition = `WHERE b.booking_date >= ?`;
      dateValue = [weekStart.toISOString().split('T')[0]];
      break;
    case 'month':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      dateCondition = `WHERE b.booking_date >= ?`;
      dateValue = [startOfMonth.toISOString().split('T')[0]];
      break;
    case '3months':
      const startOf3Months = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      dateCondition = `WHERE b.booking_date >= ?`;
      dateValue = [startOf3Months.toISOString().split('T')[0]];
      break;
    case '6months':
      const startOf6Months = new Date(today.getFullYear(), today.getMonth() - 6, 1);
      dateCondition = `WHERE b.booking_date >= ?`;
      dateValue = [startOf6Months.toISOString().split('T')[0]];
      break;
    case 'year':
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      dateCondition = `WHERE b.booking_date >= ?`;
      dateValue = [startOfYear.toISOString().split('T')[0]];
      break;
    case 'all':
    default:
      dateCondition = ``;
      dateValue = [];
  }

  try {
    const rows = await db.all(
      `SELECT b.id, b.seat_number, b.booking_date, b.day, b.time_slot,
              e.id AS employee_id, e.name, e.designation, e.department
       FROM bookings b
       JOIN employees e ON b.employee_id = e.id
       ${dateCondition}
       ORDER BY b.booking_date DESC, b.time_slot, b.seat_number`,
      dateValue
    );

    // Count helpers
    const getCount = async (sql, params = []) => {
      const row = await db.get(sql, params);
      return row ? row.count : 0;
    };

    const stats = {
      today: await getCount('SELECT COUNT(*) AS count FROM bookings WHERE booking_date = ?', [todayStr]),
      week: await getCount('SELECT COUNT(*) AS count FROM bookings WHERE booking_date >= ?', [new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()).toISOString().split("T")[0]]),
      month: await getCount('SELECT COUNT(*) AS count FROM bookings WHERE booking_date >= ?', [new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]]),
      three_months: await getCount('SELECT COUNT(*) AS count FROM bookings WHERE booking_date >= ?', [new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().split("T")[0]]),
      six_months: await getCount('SELECT COUNT(*) AS count FROM bookings WHERE booking_date >= ?', [new Date(today.getFullYear(), today.getMonth() - 6, 1).toISOString().split("T")[0]]),
      year: await getCount('SELECT COUNT(*) AS count FROM bookings WHERE booking_date >= ?', [new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0]]),
      all_time: await getCount('SELECT COUNT(*) AS count FROM bookings')
    };

    res.json({ count: rows.length, bookings: rows, stats });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

module.exports = router;
