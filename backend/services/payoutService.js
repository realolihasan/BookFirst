// Path: backend/services/payoutService.js

const Handlebars = require('handlebars');
const pdf = require('html-pdf');
const { ValidationError } = require('../middleware/errorMiddleware');
const { BF_STATUS } = require('../config/constants');
const Booking = require('../models/Booking');
const User = require('../models/User');



class PayoutService {
  constructor() {
    this.template = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 40px;
          line-height: 1.6;
        }
        .text-center { text-align: center; }
        .company-header { 
          text-align: center;
          margin-bottom: 40px;
        }
        .statement-title {
            text-align: center; 
          margin-bottom: 30px;
        }
        .details-section {
          margin-bottom: 30px;
          border: 1px solid #ddd;
          padding: 20px;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="company-header">
        <h2>BOOKFIRST</h2>
        <p>Model Agency</p>
        <p>Chmielna 73, Warsaw, 00-801, Poland</p>
        <p>booking@bookfirstmodels.com</p>
      </div>

      <div class="statement-title">
        <h1>PAYOUT STATEMENT</h1>
      </div>

      <div class="details-section">
        <p><strong>Job ID:</strong> {{jobId}}</p>
        <p><strong>Statement Date:</strong> {{date}}</p>
        <p><strong>Recipient Name:</strong> {{recipientName}}</p>
        <p><strong>Email:</strong> {{recipientEmail}}</p>
        <p><strong>Payout Amount:</strong> {{currency}} {{amount}}</p>
        <p><strong>Job Date:</strong> {{bookingDate}}</p>
        <p><strong>Work Location:</strong> {{location}}</p>
      </div>

      <div class="footer">
        <p>Please read our terms of service at bookfirstmodels.com/tos</p>
        <p>Send us an email if you have any questions at booking@bookfirstmodels.com</p>
        <p>Thank you for your work!</p>
        <p>Payment will be processed within 45 days.</p>
      </div>
    </body>
    </html>
    `;
  }

  generateStatementNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PS-${year}${month}-${random}`;
  }

  // backend/services/payoutService.js

async generatePayoutStatement(bookingId, recipientData) {
  const booking = await Booking.findById(bookingId)
    .populate('payoutStatements.recipientId', 'name email');
  
  if (!booking) {
    throw new ValidationError('Booking not found');
  }

  if (!booking.invoice?.amount) {
    throw new ValidationError('Booking invoice not found');
  }

  // Validate recipient data
  if (!recipientData.userId || !recipientData.percentage) {
    throw new ValidationError('Recipient ID and percentage are required');
  }

  const recipient = await User.findById(recipientData.userId);
  if (!recipient) {
    throw new ValidationError('Recipient not found');
  }

  // Check if a statement already exists for this recipient
  const existingStatement = booking.payoutStatements.find(
    ps => ps.recipientId && ps.recipientId._id && 
         ps.recipientId._id.toString() === recipient._id.toString()
  );

  if (existingStatement) {
    throw new ValidationError('Payout statement already exists for this recipient');
  }

  const statementNumber = this.generateStatementNumber();
  const amount = (booking.invoice.amount * (recipientData.percentage / 100)).toFixed(2);

  const templateData = {
    statementNumber,
    date: new Date().toLocaleDateString(),
    invoiceNumber: booking.invoice.number,
    recipientName: recipient.name,
    recipientEmail: recipient.email,
    jobId: booking.jobId,
    brandName: booking.brandName,
    bookingDate: new Date(booking.date).toLocaleDateString(),
    location: `${booking.location.city}, ${booking.location.country}`,
    currency: booking.invoice.currency,
    amount
  };

  const template = Handlebars.compile(this.template);
  const html = template(templateData);

  const pdfBuffer = await new Promise((resolve, reject) => {
    pdf.create(html, { format: 'A4', border: '1cm' }).toBuffer((err, buffer) => {
      if (err) reject(err);
      else resolve(buffer);
    });
  });

  const payoutStatement = {
    recipientId: recipient._id,
    amount: parseFloat(amount),
    percentage: recipientData.percentage,
    statementNumber,
    generatedDate: new Date(),
    status: BF_STATUS.PENDING
  };

  booking.payoutStatements.push(payoutStatement);
  await booking.save();

  return {
    html,
    pdfBuffer,
    statementNumber
  };
}

  // backend/services/payoutService.js

  async downloadPayoutStatement(bookingId, recipientId) {
    console.log('Downloading statement for:', { bookingId, recipientId });
  
    const booking = await Booking.findById(bookingId)
      .populate('payoutStatements.recipientId', 'name email');
    
    if (!booking) {
      throw new ValidationError('Booking not found');
    }
  
    console.log('Booking payout statements:', JSON.stringify(booking.payoutStatements, null, 2));
  
    // Modified statement search logic
    const statement = booking.payoutStatements.find(ps => {
      if (!ps.recipientId) return false;
      
      // Handle both populated and unpopulated cases
      const psRecipientId = ps.recipientId._id ? ps.recipientId._id.toString() : ps.recipientId.toString();
      
      console.log('Comparing:', {
        psRecipientId,
        searchedRecipientId: recipientId,
        isMatch: psRecipientId === recipientId
      });
      
      return psRecipientId === recipientId;
    });
  
    if (!statement) {
      throw new ValidationError('Payout statement not found');
    }
  
    // Get recipient information
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw new ValidationError('Recipient not found');
    }
  
    const templateData = {
      statementNumber: statement.statementNumber,
      date: new Date(statement.generatedDate).toLocaleDateString(),
      invoiceNumber: booking.invoice.number,
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      jobId: booking.jobId,
      brandName: booking.brandName,
      bookingDate: new Date(booking.date).toLocaleDateString(),
      location: `${booking.location.city}, ${booking.location.country}`,
      currency: booking.invoice.currency,
      amount: statement.amount
    };
  
    const template = Handlebars.compile(this.template);
    const html = template(templateData);
  
    const pdfBuffer = await new Promise((resolve, reject) => {
      pdf.create(html, { format: 'A4', border: '1cm' }).toBuffer((err, buffer) => {
        if (err) reject(err);
        else resolve(buffer);
      });
    });
  
    return {
      pdfBuffer,
      statementNumber: statement.statementNumber
    };
  }

  async updatePayoutStatus(bookingId, recipientId, newStatus, adminId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ValidationError('Booking not found');
    }

    const payoutIndex = booking.payoutStatements.findIndex(
      ps => ps.recipientId.toString() === recipientId
    );

    if (payoutIndex === -1) {
      throw new ValidationError('Payout statement not found');
    }

    const validStatuses = [BF_STATUS.PENDING, BF_STATUS.PAID];
    if (!validStatuses.includes(newStatus)) {
      throw new ValidationError('Invalid status');
    }

    booking.payoutStatements[payoutIndex].status = newStatus;
    if (newStatus === BF_STATUS.PAID) {
      booking.payoutStatements[payoutIndex].processedDate = new Date();
      booking.payoutStatements[payoutIndex].processedBy = adminId;
    }

    await booking.save();
    return booking;
  }
}

module.exports = new PayoutService();