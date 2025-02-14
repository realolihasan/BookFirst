// Path: backend/services/invoiceService.js
const PDFDocument = require('pdfkit');
const { ValidationError } = require('../middleware/errorMiddleware');
const Booking = require('../models/Booking');

class InvoiceService {
  generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  }

  async generateInvoice(bookingId, invoiceData) {
    console.log("Invoice Data Received:", invoiceData);
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ValidationError('Booking not found');
    }

    const invoiceNumber = this.generateInvoiceNumber();

    // Create PDF document
    const doc = new PDFDocument();
    const chunks = [];

    return new Promise((resolve, reject) => {
      // Handle document chunks
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve({ pdfBuffer, invoiceNumber });
      });
      doc.on('error', reject);

      // Add content to PDF
      doc.fontSize(20).text('BOOKFIRST', { align: 'center' });
      doc.fontSize(14).text('Model Agency', { align: 'center' });
      doc.text('Chmielna 73, Warsaw, 00-801, Poland', { align: 'center' });
      doc.text('booking@bookfirstmodels.com', { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(18).text('INVOICE', { align: 'center' });
      doc.moveDown();

      // Invoice details
      doc.fontSize(12);
      doc.text(`Job ID: ${booking.jobId}`);
      doc.text(`Date: ${new Date().toLocaleDateString()}`);
      doc.text(`Customer Name: ${booking.brandName}`);
      doc.text(`Amount Due: ${invoiceData.currency} ${invoiceData.amount}`);
      doc.text(`Work Location: ${booking.location.city}, ${booking.location.country}`);
      doc.text(`Work Description: ${invoiceData.description}`);
      
      doc.moveDown();
      // Payment section
      doc.fontSize(14).text('Payment Instructions');
      doc.fontSize(12);
      doc.text('Account Holder: Md Oliul Hasan');
      doc.text('IBAN: GB21TRWI23147023261393');
      doc.text('SWIFT: TRWIGB2LXXX');
      doc.text('Currencies: EUR or Equivalent in GBP, USD, CAD, AED, PLN');
      doc.text('Bank Address: Wise Payments Limited, 56 Shoreditch High Street, London, E1 6JJ, United Kingdom');
      
      doc.moveDown();
      // Footer
      doc.fontSize(10);
      doc.text('Please read our terms of service at bookfirstmodels.com/tos', { align: 'center' });
      doc.text('Send us an email if you have any questions at booking@bookfirstmodels.com', { align: 'center' });
      doc.text('Thank you for your business.', { align: 'center' });
      doc.text('Payment due within 30 days of the date of the invoice.', { align: 'center' });

      // Update booking with invoice details
      booking.invoice = {
        amount: invoiceData.amount,
        currency: invoiceData.currency,
        description: invoiceData.description,
        number: invoiceNumber,
        generatedDate: new Date()
      };
      booking.save();

      // Finalize the PDF
      doc.end();
    });
  }
}

module.exports = new InvoiceService();