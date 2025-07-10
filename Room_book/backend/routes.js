// routes.js
const express = require('express');
const router = express.Router();
const db = require('./db');

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day;
  const sunday = new Date(now.setDate(diff));
  sunday.setHours(0, 0, 0, 0);
  return sunday.toISOString().split('T')[0];
}

const daysMap = {
  'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
  'Thursday': 4, 'Friday': 5, 'Saturday': 6
};

// ✅ GET available seats
router.get('/seats', async (req, res) => {
  const { booking_date, time } = req.query;
  console.log(`[GET] /seats hit with booking_date=${booking_date}, time=${time}`);
  try {
    const [rows] = await db.query(
      'SELECT seat_number FROM bookings WHERE booking_date = ? AND time_slot = ?',
      [booking_date, time]
    );

    const bookedSeats = rows.map(row => row.seat_number);
    res.json({ bookedSeats });
  } catch (err) {
    console.error('Error fetching seats:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ POST book a seat
router.post('/book', async (req, res) => {
  const { employeeId, seatNumber, booking_date, time } = req.body;

  // Validate booking_date format
  if (!booking_date || !/^\d{4}-\d{2}-\d{2}$/.test(booking_date)) {
    return res.status(400).json({ message: 'Invalid or missing booking_date' });
  }

  // Calculate week start (Sunday) based on booking_date
  const bookingDateObj = new Date(booking_date);
  const dayOfWeek = bookingDateObj.getDay(); // Sunday = 0
  const sunday = new Date(bookingDateObj);
  sunday.setDate(bookingDateObj.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);
  const weekStart = sunday.toISOString().split('T')[0];

  // Get day name from booking_date
  const day = bookingDateObj.toLocaleDateString('en-US', { weekday: 'long' });

  try {
    const [emp] = await db.query("SELECT * FROM employees WHERE id = ?", [employeeId]);
    if (emp.length === 0) return res.status(400).json({ message: 'Invalid Employee ID' });

    const [exists] = await db.query(
      `SELECT * FROM bookings WHERE seat_number = ? AND booking_date = ? AND time_slot = ?`,
      [seatNumber, booking_date, time]
    );
    if (exists.length > 0) return res.status(400).json({ message: 'Seat already booked' });

    await db.query(
      `INSERT INTO bookings (employee_id, seat_number, day, time_slot, week_start, booking_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employeeId, seatNumber, day, time, weekStart, booking_date]
    );

    res.json({ message: 'Booking successful' });
  } catch (err) {
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

// ✅ GET admin bookings
router.get('/admin/bookings', async (req, res) => {
  const range = req.query.range || 'week'; // default to 'week'

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
      const weekStartStr = weekStart.toISOString().split('T')[0];
      dateCondition = `WHERE b.booking_date >= ?`;
      dateValue = [weekStartStr];
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
    // Get filtered bookings
    const [rows] = await db.query(
      `SELECT b.id, b.seat_number, DATE_FORMAT(b.booking_date, '%Y-%m-%d') AS booking_date, 
              b.day, b.time_slot,
              e.id AS employee_id, e.name, e.designation, e.department
       FROM bookings b
       JOIN employees e ON b.employee_id = e.id
       ${dateCondition}
       ORDER BY b.booking_date DESC, b.time_slot, b.seat_number`,
      dateValue
    );

    // Calculate stats for all ranges regardless of filter
    const getCount = async (sql, params=[]) => {
      const [result] = await db.query(sql, params);
      return result[0]?.count || 0;
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
    console.error('Error in filtered /admin/bookings:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});


module.exports = router;
