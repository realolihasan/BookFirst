// Path: backend/services/bookingService.js

const Booking = require('../models/Booking');
const { BF_STATUS } = require('../config/constants');
const { ValidationError, NotFoundError } = require('../middleware/errorMiddleware');

class BookingService {
  constructor() {
    // No invoice or payout integration needed.
  }

  generateJobId() {
    const date = new Date();
    const prefix = 'BF';
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${dateStr}-${random}`;
  }

  async createBooking(bookingData) {
    const jobId = this.generateJobId();
    const booking = new Booking({
      ...bookingData,
      jobId,
      status: BF_STATUS.REQUESTED
    });
    await booking.save();
    return booking;
  }

  async getBooking(id) {
    const booking = await Booking.findById(id)
      .populate('portfolios')
      .populate('handledBy', 'name email');
      
    if (!booking) throw new NotFoundError('Booking not found');
    return booking;
  }

  async getBookings(filters = {}) {
    return Booking.find(filters)
      .populate('portfolios')
      .populate('handledBy', 'name email')
      .sort('-createdAt');
  }

  async updateBooking(id, bookingData, userId) {
    const booking = await this.getBooking(id);
    if (!booking) throw new NotFoundError('Booking not found');
  
    Object.assign(booking, bookingData);
    booking.handledBy = userId;
    
    await booking.save();
    return booking;
  }
  
  async getBookingsByEmail(email) {
    return this.getBookings({ brandEmail: email });
  }

  // In bookingService.js, modify this existing method:
async getBookingsByModel(portfolioId) {
  return this.getBookings({ 
    portfolios: portfolioId,
    status: { $in: ['confirmed', 'completed'] }  // Add this line to filter status
  });
}

  async updateBookingStatus(id, newStatus, userId) {
    const booking = await this.getBooking(id);
    
    if (!this.isValidStatusTransition(booking.status, newStatus)) {
      throw new ValidationError(`Invalid status transition from ${booking.status} to ${newStatus}`);
    }

    booking.status = newStatus;
    booking.handledBy = userId;
    
    if (newStatus === BF_STATUS.COMPLETED) {
      booking.completedAt = new Date();
    }

    await booking.save();
    return booking;
  }

  isValidStatusTransition(currentStatus, newStatus) {
    const transitions = {
      [BF_STATUS.REQUESTED]: [BF_STATUS.CONFIRMED, BF_STATUS.CANCELLED],
      [BF_STATUS.CONFIRMED]: [BF_STATUS.COMPLETED, BF_STATUS.CANCELLED],
      [BF_STATUS.COMPLETED]: [BF_STATUS.CANCELLED],
      [BF_STATUS.CANCELLED]: []
    };
    return transitions[currentStatus]?.includes(newStatus);
  }
}

module.exports = new BookingService();