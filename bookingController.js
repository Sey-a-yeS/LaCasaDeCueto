import Booking from '../models/Booking.js';

// POST → Save booking
export const createBooking = async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    await newBooking.save();
    res.status(201).json({ message: 'Booking confirmed!', booking: newBooking });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET → Get all booked dates for a room
export const getBookedDates = async (req, res) => {
  try {
    const roomCode = req.params.roomCode;
    const bookings = await Booking.find({ roomCode });
    const formatted = bookings.map(b => ({
      start: b.checkin,
      end: b.checkout
    }));
    res.status(200).json(formatted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
