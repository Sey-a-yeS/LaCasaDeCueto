// calendar.js — controls the interactive room-specific booking calendar for La Casa De Cueto

document.addEventListener('DOMContentLoaded', () => {
  const calendarModal = document.getElementById('calendarModal');
  const calendarContainer = document.getElementById('calendarContainer');
  const confirmBtn = document.getElementById('confirmDatesBtn');
  let selectedRoom = null;
  let selectedCheckIn = null;
  let selectedCheckOut = null;

  const bookedDates = {
    room1: [{ start: new Date('2025-10-30'), end: new Date('2025-11-02') }],
    room2: [{ start: new Date('2025-11-08'), end: new Date('2025-11-11') }]
  };

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
    renderCalendar(new Date());
  }

  window.closeCalendar = function() {
    calendarModal.classList.remove('show');
    calendarModal.setAttribute('aria-hidden', 'true');
    selectedCheckIn = null;
    selectedCheckOut = null;
  };

  function renderCalendar(currentDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <button class="btn" id="prevMonth">←</button>
      <h4 style="margin:0; font-family:'Playfair Display', serif;">${monthName} ${year}</h4>
      <button class="btn" id="nextMonth">→</button>
    </div>`;

    html += '<div style="display:grid; grid-template-columns:repeat(7,1fr); text-align:center; gap:6px;">';
    const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    weekdays.forEach(d => html += `<div style='font-weight:700;'>${d}</div>`);

    for (let i = 0; i < firstDay.getDay(); i++) html += '<div></div>';

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const isBooked = checkBooked(date);
      const isSelected = selectedCheckIn && selectedCheckOut && date >= selectedCheckIn && date <= selectedCheckOut;

      let style = `padding:10px; border-radius:8px; cursor:pointer; border:1px solid #ddd;`;
      if (isBooked) style += `background-color:#8B7D6C; opacity:0.6; color:white; cursor:not-allowed;`;
      else if (isSelected) style += `background-color:#B5A78B; color:white;`;
      else style += `background-color:white; color:#545454;`;

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
