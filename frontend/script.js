// script.js

const dateSelect = document.getElementById('dateSelect');
const timeSelect = document.getElementById('timeSelect');
const seatContainer = document.getElementById('seatContainer');
const bookingModal = document.getElementById('bookingModal');
const seatDetails = document.getElementById('seatDetails');
const employeeIdInput = document.getElementById('employeeId');
const confirmBookingBtn = document.getElementById('confirmBooking');
const closeModalBtn = document.getElementById('closeModal');

// const server_url = "http://localhost:3000/api";
const server_url = "https://swlb.christuniversity.in:3000/api"; // Production URL

let selectedSeat = null;
let selectedDate = null;
let selectedTime = null;

const TOTAL_SEATS = 7;

dateSelect.addEventListener('change', loadSeats);
timeSelect.addEventListener('change', loadSeats);

function populateDateDropdown() {
  const today = new Date();
  dateSelect.innerHTML = '<option value="" disabled selected>Select Date</option>';

  for (let i = 0; i < 7; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);

    const iso = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayName = futureDate.toLocaleDateString('en-US', { weekday: 'long' });

    const option = document.createElement('option');
    option.value = iso;
    option.textContent = `${iso} (${dayName})`;
    dateSelect.appendChild(option);
  }
}

populateDateDropdown();

function loadSeats() {
  selectedDate = dateSelect.value;
  selectedTime = timeSelect.value;

  if (!selectedDate || !selectedTime) return;
  console.log(`Fetching seats for ${selectedDate} at ${selectedTime}`);
  fetch(server_url + `/seats?booking_date=${selectedDate}&time=${encodeURIComponent(selectedTime)}`)
    .then(res => res.json())
    .then(data => {
      renderSeats(data.bookedSeats);
    })
    .catch(err => {
      console.error('Error fetching seats:', err);
    });
}


function renderSeats(bookedSeats) {
  seatContainer.innerHTML = ''; // clear

  for (let i = 1; i <= TOTAL_SEATS; i++) {
    const seat = document.createElement('div');
    seat.classList.add('seat');
    seat.textContent = i;

    if (bookedSeats.includes(i)) {
      seat.classList.add('booked');
    } else {
      seat.addEventListener('click', () => openModal(i));
    }

    seatContainer.appendChild(seat);
  }
}

function openModal(seatNumber) {
  selectedSeat = seatNumber;
  const dayName = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
  seatDetails.textContent = `Seat ${seatNumber} on ${selectedDate} (${dayName}) at ${selectedTime}`;
  employeeIdInput.value = '';
  bookingModal.style.display = 'flex';
}


closeModalBtn.addEventListener('click', () => {
  bookingModal.style.display = 'none';
});

confirmBookingBtn.addEventListener('click', () => {
  const employeeId = employeeIdInput.value.trim();

  if (!employeeId) {
    alert('Please enter your Employee ID');
    return;
  }

  const payload = {
    employeeId,
    seatNumber: selectedSeat,
    booking_date: selectedDate,
    time: selectedTime
  };

  fetch(server_url + '/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      bookingModal.style.display = 'none';
      loadSeats(); // refresh UI
    })
    .catch(err => {
      console.error('Booking error:', err);
      alert('Something went wrong!');
    });
});
