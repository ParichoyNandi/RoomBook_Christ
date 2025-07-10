const bookingTableBody = document.querySelector('#bookingTable tbody');
const filterRange = document.getElementById('filterRange');
const showStatsBtn = document.getElementById('showStatsBtn');
const statsModal = document.getElementById('statsModal');
const statsList = document.getElementById('statsList');
const closeStatsBtn = document.getElementById('closeStatsBtn');

let cachedStats = {}; // store latest stats for modal

function loadAdminBookings(range = 'week') {
  fetch(`http://localhost:3000/api/admin/bookings?range=${range}`)
    .then(res => res.json())
    .then(data => {
      // Update table
      const bookings = data.bookings || [];
      bookingTableBody.innerHTML = '';

      if (bookings.length === 0) {
        bookingTableBody.innerHTML = '<tr><td colspan="8">No bookings found for this range.</td></tr>';
      } else {
        bookings.forEach(booking => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${booking.seat_number}</td>
            <td>${booking.booking_date}</td>
            <td>${booking.day}</td>
            <td>${booking.time_slot}</td>
            <td>${booking.employee_id}</td>
            <td>${booking.name}</td>
            <td>${booking.designation}</td>
            <td>${booking.department}</td>
          `;
          bookingTableBody.appendChild(tr);
        });
      }

      // Store full stats for modal display
      cachedStats = data.stats || {};
    })
    .catch(err => {
      console.error('Error loading admin bookings:', err);
      bookingTableBody.innerHTML = '<tr><td colspan="8">Error loading bookings.</td></tr>';
    });
}

// Modal handling
showStatsBtn.addEventListener('click', () => {
  statsList.innerHTML = `
    <li><strong>Today:</strong> ${cachedStats.today ?? 0}</li>
    <li><strong>This Week:</strong> ${cachedStats.week ?? 0}</li>
    <li><strong>This Month:</strong> ${cachedStats.month ?? 0}</li>
    <li><strong>Last 3 Months:</strong> ${cachedStats.three_months ?? 0}</li>
    <li><strong>Last 6 Months:</strong> ${cachedStats.six_months ?? 0}</li>
    <li><strong>This Year:</strong> ${cachedStats.year ?? 0}</li>
    <li><strong>All Time:</strong> ${cachedStats.all_time ?? 0}</li>
  `;
  statsModal.style.display = 'flex';
});

closeStatsBtn.addEventListener('click', () => {
  statsModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === statsModal) {
    statsModal.style.display = 'none';
  }
});

window.onload = () => {
  const initialRange = filterRange ? filterRange.value : 'week';
  loadAdminBookings(initialRange);
};

filterRange?.addEventListener('change', () => {
  loadAdminBookings(filterRange.value);
});
