// calendar.js — interactive room-specific booking calendar for La Casa De Cueto

document.addEventListener('DOMContentLoaded', () => {
  const calendarModal = document.getElementById('calendarModal');
  const calendarContainer = document.getElementById('calendarContainer');
  const confirmBtn = document.getElementById('confirmDatesBtn');
  let selectedRoom = null;
  let selectedCheckIn = null;
  let selectedCheckOut = null;
  let bookedDates = {}; // Will be fetched dynamically

  // 🔗 Replace this with your backend URL after deployment
  const API_BASE_URL = "http://localhost:5000/api/bookings";

  // Fetch booked dates from backend
  async function loadBookedDates(roomCode) {
    try {
      const response = await fetch(`${API_BASE_URL}/${roomCode}`);
      const data = await response.json();

      // Convert date strings to Date objects
      bookedDates[roomCode] = data.map(r => ({
        start: new Date(r.start),
        end: new Date(r.end)
      }));

      renderCalendar(new Date());
    } catch (error) {
      console.error("⚠️ Failed to load booked dates:", error);
      bookedDates[roomCode] = []; // fallback
      renderCalendar(new Date());
    }
  }

  // Handle opening of room calendars
  document.querySelectorAll('.room-card .btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      selectedRoom = btn.closest('.room-card').dataset.roomCode;
      openCalendar();
    });
  });

  confirmBtn.addEventListener('click', () => {
    if (selectedCheckIn && selectedCheckOut) {
      document.getElementById('checkin').valueAsDate = selectedCheckIn;
      document.getElementById('checkout').valueAsDate = selectedCheckOut;
      closeCalendar();
      document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
    } else {
      alert('Please select both check-in and check-out dates.');
    }
  });

  function openCalendar() {
    calendarModal.classList.add('show');
    calendarModal.setAttribute('aria-hidden', 'false');
    loadBookedDates(selectedRoom); // 🔥 Fetch live data
    if (typeof window.trapFocus === 'function') window.trapFocus(calendarModal);
  }

  window.openCalendarForRoom = function (roomCode) {
    selectedRoom = roomCode || selectedRoom;
    openCalendar();
  };

  window.closeCalendar = function () {
    calendarModal.classList.remove('show');
    calendarModal.setAttribute('aria-hidden', 'true');
    selectedCheckIn = null;
    selectedCheckOut = null;
    if (typeof window.releaseFocus === 'function') window.releaseFocus();
  };

  function renderCalendar(currentDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <button class="btn" id="prevMonth">←</button>
      <h4 style="margin:0; font-family:'Playfair Display', serif;">${monthName} ${year}</h4>
      <button class="btn" id="nextMonth">→</button>
    </div>`;

    html += '<div style="display:grid; grid-template-columns:repeat(7,1fr); text-align:center; gap:6px;">';
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(d => html += `<div style='font-weight:700;'>${d}</div>`);

    for (let i = 0; i < firstDay.getDay(); i++) html += '<div></div>';

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const isBooked = checkBooked(date);
      const isStart = selectedCheckIn && date.toDateString() === selectedCheckIn.toDateString();
      const isEnd = selectedCheckOut && date.toDateString() === selectedCheckOut.toDateString();
      const isInRange = selectedCheckIn && selectedCheckOut && date >= selectedCheckIn && date <= selectedCheckOut;

      let style = `padding:10px; border-radius:8px; cursor:pointer; border:1px solid #ddd;`;
      if (isBooked) {
        style += `background-color:#8B7D6C; opacity:0.6; color:white; cursor:not-allowed;`;
      } else if (date < today) {
        style += `background-color:#f1f1f1; color:#bbb; cursor:not-allowed; border:1px solid #eee;`;
      } else if (isStart && !selectedCheckOut) {
        style += `background-color:#B5A78B; color:white; font-weight:700;`;
      } else if (isStart && isEnd) {
        style += `background-color:#B5A78B; color:white; font-weight:700;`;
      } else if (isStart) {
        style += `background: linear-gradient(90deg, #B5A78B 0%, rgba(181,167,139,0.9) 100%); color:white; font-weight:700;`;
      } else if (isEnd) {
        style += `background: linear-gradient(90deg, rgba(181,167,139,0.9) 0%, #B5A78B 100%); color:white; font-weight:700;`;
      } else if (isInRange) {
        style += `background-color:rgba(181,167,139,0.65); color:white;`;
      } else {
        style += `background-color:white; color:#545454;`;
      }

      html += `<div data-date='${date.toISOString()}' style='${style}'>${d}</div>`;
    }

    html += '</div>';
    calendarContainer.innerHTML = html;

    document.getElementById('prevMonth').onclick = () => renderCalendar(new Date(year, month - 1, 1));
    document.getElementById('nextMonth').onclick = () => renderCalendar(new Date(year, month + 1, 1));

    calendarContainer.querySelectorAll('[data-date]').forEach(cell => {
      const date = new Date(cell.dataset.date);
      if (!checkBooked(date)) {
        cell.addEventListener('click', () => handleDateClick(date));
      }
    });
  }

  function checkBooked(date) {
    const ranges = bookedDates[selectedRoom] || [];
    return ranges.some(r => date >= r.start && date <= r.end);
  }

  function handleDateClick(date) {
    if (!selectedCheckIn || (selectedCheckIn && selectedCheckOut)) {
      selectedCheckIn = date;
      selectedCheckOut = null;
    } else if (date > selectedCheckIn) {
      selectedCheckOut = date;
    } else {
      selectedCheckIn = date;
      selectedCheckOut = null;
    }
    renderCalendar(date);
  }
});

// Resume booking if calendar confirmation finishes a pending action
document.addEventListener('DOMContentLoaded', () => {
  const confirmBtn = document.getElementById('confirmDatesBtn');
  if (!confirmBtn) return;
  confirmBtn.addEventListener('click', () => {
    setTimeout(() => {
      if (window._booking_resume_intent) {
        window._booking_resume_intent = false;
        const bookingForm = document.getElementById('bookingForm');
        if (bookingForm) {
          bookingForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      }
    }, 120);
  });
});
