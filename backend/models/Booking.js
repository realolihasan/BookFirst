// Path: backend/models/Booking.js

const mongoose = require('mongoose');
const { 
 MODEL_NAMES, 
 BF_STATUS,
 DURATION_UNITS 
} = require('../config/constants');

const bookingSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true
  },
  brandName: {
    type: String,
    required: true
  },
  brandEmail: {
    type: String,
    required: true
  },

 // Phone number for contact
 phone: {
   type: String, 
   required: true
 },

 // Selected Models
 portfolios: [{
   type: mongoose.Schema.Types.ObjectId,
   ref: MODEL_NAMES.PORTFOLIO,
   required: true
 }],

 // Schedule
 date: {
   type: Date,
   required: true
 },
 time: {
   type: String,
   required: true
 },
 duration: {
   value: {
     type: Number,
     required: true
   },
   unit: {
     type: String,
     enum: Object.values(DURATION_UNITS),
     required: true
   }
 },

 // Location
 location: {
   streetAddress: {
     type: String,
     required: true
   },
   city: {
     type: String,
     required: true
   },
   country: {
     type: String,
     required: true
   },
 },

 // Work Description
 workDescription: {
   type: String,
   required: true,
   maxLength: 500
 },

 // Invoice
 invoice: {
  amount: Number,
  description: String,
  generatedDate: Date,
  number: String,
  currency: {
    type: String,
    enum: ['EUR', 'USD', 'CAD', 'GBP', 'PLN', 'AED'],
    default: 'USD'
  }
},

 // Payout Statements
 payoutStatements: [{
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODEL_NAMES.USER
  },
  amount: Number,
  percentage: Number,
  statementNumber: String,
  generatedDate: Date,
  status: {
    type: String,
    enum: [BF_STATUS.PENDING, BF_STATUS.PAID],
    default: BF_STATUS.PENDING
  },
  processedDate: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODEL_NAMES.USER
  }
}],

 // Status
 status: {
   type: String,
   enum: Object.values(BF_STATUS),
   default: BF_STATUS.REQUESTED,
   index: true
 },
 handledBy: {
   type: mongoose.Schema.Types.ObjectId,
   ref: MODEL_NAMES.USER
 },
 completedAt: Date
}, {
 timestamps: true
});

// Indexes
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ date: 1 });

const Booking = mongoose.model(MODEL_NAMES.BOOKING, bookingSchema);

module.exports = Booking;