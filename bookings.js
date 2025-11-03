import express from 'express';
import { createBooking, getBookedDates } from '../controllers/bookingController.js';

const router = express.Router();

// POST → Save booking to database
router.post('/', createBooking);

// GET → Fetch booked dates for a specific room
router.get('/:roomCode', getBookedDates);

export default router;
