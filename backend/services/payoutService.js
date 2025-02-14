// Path: backend/services/payoutService.js
const PDFDocument = require('pdfkit');
const { ValidationError } = require('../middleware/errorMiddleware');
const { BF_STATUS } = require('../config/constants');
const Booking = require('../models/Booking');
const User = require('../models/User');

class PayoutService {
 generateStatementNumber() {
   const date = new Date();
   const year = date.getFullYear();
   const month = String(date.getMonth() + 1).padStart(2, '0');
   const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
   return `PS-${year}${month}-${random}`;
 }

 async generatePayoutStatement(bookingId, recipientData) {
   const booking = await Booking.findById(bookingId)
     .populate('payoutStatements.recipientId', 'name email');
   
   if (!booking) {
     throw new ValidationError('Booking not found');
   }

   if (!booking.invoice?.amount) {
     throw new ValidationError('Booking invoice not found');
   }

   if (!recipientData.userId || !recipientData.percentage) {
     throw new ValidationError('Recipient ID and percentage are required');
   }

   const recipient = await User.findById(recipientData.userId);
   if (!recipient) {
     throw new ValidationError('Recipient not found');
   }

   const existingStatement = booking.payoutStatements.find(
     ps => ps.recipientId && ps.recipientId._id && 
          ps.recipientId._id.toString() === recipient._id.toString()
   );

   if (existingStatement) {
     throw new ValidationError('Payout statement already exists for this recipient');
   }

   const statementNumber = this.generateStatementNumber();
   const amount = (booking.invoice.amount * (recipientData.percentage / 100)).toFixed(2);

   // Create PDF document
   const doc = new PDFDocument();
   const chunks = [];

   return new Promise((resolve, reject) => {
     doc.on('data', chunk => chunks.push(chunk));
     doc.on('end', async () => {
       const pdfBuffer = Buffer.concat(chunks);
       
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

       resolve({ pdfBuffer, statementNumber });
     });
     doc.on('error', reject);

     // Add content to PDF
     doc.fontSize(20).text('BOOKFIRST', { align: 'center' });
     doc.fontSize(14).text('Model Agency', { align: 'center' });
     doc.text('Chmielna 73, Warsaw, 00-801, Poland', { align: 'center' });
     doc.text('booking@bookfirstmodels.com', { align: 'center' });
     
     doc.moveDown();
     doc.fontSize(18).text('PAYOUT STATEMENT', { align: 'center' });
     doc.moveDown();

     // Statement details
     doc.fontSize(12);
     doc.text(`Job ID: ${booking.jobId}`);
     doc.text(`Statement Date: ${new Date().toLocaleDateString()}`);
     doc.text(`Recipient Name: ${recipient.name}`);
     doc.text(`Email: ${recipient.email}`);
     doc.text(`Payout Amount: ${booking.invoice.currency} ${amount}`);
     doc.text(`Job Date: ${new Date(booking.date).toLocaleDateString()}`);
     doc.text(`Work Location: ${booking.location.city}, ${booking.location.country}`);
     
     doc.moveDown();
     // Footer
     doc.fontSize(10);
     doc.text('Please read our terms of service at bookfirstmodels.com/tos', { align: 'center' });
     doc.text('Send us an email if you have any questions at booking@bookfirstmodels.com', { align: 'center' });
     doc.text('Thank you for your work!', { align: 'center' });
     doc.text('Payment will be processed within 45 days.', { align: 'center' });

     doc.end();
   });
 }

 async downloadPayoutStatement(bookingId, recipientId) {
   console.log('Downloading statement for:', { bookingId, recipientId });
 
   const booking = await Booking.findById(bookingId)
     .populate('payoutStatements.recipientId', 'name email');
   
   if (!booking) {
     throw new ValidationError('Booking not found');
   }
 
   console.log('Booking payout statements:', JSON.stringify(booking.payoutStatements, null, 2));
 
   const statement = booking.payoutStatements.find(ps => {
     if (!ps.recipientId) return false;
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
 
   const recipient = await User.findById(recipientId);
   if (!recipient) {
     throw new ValidationError('Recipient not found');
   }

   // Create PDF document
   const doc = new PDFDocument();
   const chunks = [];

   return new Promise((resolve, reject) => {
     doc.on('data', chunk => chunks.push(chunk));
     doc.on('end', () => {
       const pdfBuffer = Buffer.concat(chunks);
       resolve({ pdfBuffer, statementNumber: statement.statementNumber });
     });
     doc.on('error', reject);

     // Add content to PDF
     doc.fontSize(20).text('BOOKFIRST', { align: 'center' });
     doc.fontSize(14).text('Model Agency', { align: 'center' });
     doc.text('Chmielna 73, Warsaw, 00-801, Poland', { align: 'center' });
     doc.text('booking@bookfirstmodels.com', { align: 'center' });
     
     doc.moveDown();
     doc.fontSize(18).text('PAYOUT STATEMENT', { align: 'center' });
     doc.moveDown();

     // Statement details
     doc.fontSize(12);
     doc.text(`Job ID: ${booking.jobId}`);
     doc.text(`Statement Date: ${new Date(statement.generatedDate).toLocaleDateString()}`);
     doc.text(`Recipient Name: ${recipient.name}`);
     doc.text(`Email: ${recipient.email}`);
     doc.text(`Payout Amount: ${booking.invoice.currency} ${statement.amount}`);
     doc.text(`Job Date: ${new Date(booking.date).toLocaleDateString()}`);
     doc.text(`Work Location: ${booking.location.city}, ${booking.location.country}`);
     
     doc.moveDown();
     // Footer
     doc.fontSize(10);
     doc.text('Please read our terms of service at bookfirstmodels.com/tos', { align: 'center' });
     doc.text('Send us an email if you have any questions at booking@bookfirstmodels.com', { align: 'center' });
     doc.text('Thank you for your work!', { align: 'center' });
     doc.text('Payment will be processed within 45 days.', { align: 'center' });

     doc.end();
   });
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