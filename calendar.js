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
    // trap focus in calendar modal if focus helpers are available
    if (typeof window.trapFocus === 'function') window.trapFocus(calendarModal);
  }

  // Expose a global helper so the main page can open the calendar for a given room
  window.openCalendarForRoom = function(roomCode) {
    selectedRoom = roomCode || selectedRoom;
    openCalendar();
  };

  window.closeCalendar = function() {
    calendarModal.classList.remove('show');
    calendarModal.setAttribute('aria-hidden', 'true');
    selectedCheckIn = null;
    selectedCheckOut = null;
    // release focus trap if present
    if (typeof window.releaseFocus === 'function') window.releaseFocus();
  };

  function renderCalendar(currentDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0,0,0,0);

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
      // Determine selection state: start, end, in-range (when both selected), or single selected start
      const isStart = selectedCheckIn && date.toDateString() === selectedCheckIn.toDateString();
      const isEnd = selectedCheckOut && date.toDateString() === selectedCheckOut.toDateString();
      const isInRange = selectedCheckIn && selectedCheckOut && date >= selectedCheckIn && date <= selectedCheckOut;

      let style = `padding:10px; border-radius:8px; cursor:pointer; border:1px solid #ddd;`;
      if (isBooked) {
        style += `background-color:#8B7D6C; opacity:0.6; color:white; cursor:not-allowed;`;
      } else if (date < today) {
        // past dates disabled
        style += `background-color:#f1f1f1; color:#bbb; cursor:not-allowed; border:1px solid #eee;`;
      } else if (isStart && !selectedCheckOut) {
        // Only start selected (single click) — mark it so user sees immediate selection
        style += `background-color:#B5A78B; color:white; font-weight:700;`;
      } else if (isStart && isEnd) {
        // Same day start & end (edge-case)
        style += `background-color:#B5A78B; color:white; font-weight:700;`;
      } else if (isStart) {
        // Range start
        style += `background: linear-gradient(90deg, #B5A78B 0%, rgba(181,167,139,0.9) 100%); color:white; font-weight:700;`;
      } else if (isEnd) {
        // Range end
        style += `background: linear-gradient(90deg, rgba(181,167,139,0.9) 0%, #B5A78B 100%); color:white; font-weight:700;`;
      } else if (isInRange) {
        // Middle of selected range
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

// Listen for resume intent: when dates are confirmed we may need to continue a pending booking submit
document.addEventListener('DOMContentLoaded', () => {
  const confirmBtn = document.getElementById('confirmDatesBtn');
  if (!confirmBtn) return;
  // wrap existing handler: after user confirms dates, if there's a resume intent, re-submit booking form
  confirmBtn.addEventListener('click', () => {
    // tiny delay to let calendar.js earlier handler set the form values
    setTimeout(() => {
      if (window._booking_resume_intent) {
        window._booking_resume_intent = false;
        const bookingForm = document.getElementById('bookingForm');
        if (bookingForm) {
          // Programmatically trigger submit to continue flow (this will call the bookingForm handler in index.html)
          bookingForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      }
    }, 120);
  });
});
