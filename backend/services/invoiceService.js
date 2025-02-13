// Path: backend/services/invoiceService.js
const Handlebars = require('handlebars');
const pdf = require('html-pdf');
const { ValidationError } = require('../middleware/errorMiddleware');
const Booking = require('../models/Booking');

class InvoiceService {
  constructor() {
    // Invoice template using Handlebars
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
        .invoice-content {
          margin-bottom: 30px;
        }
        .details-section {
          margin-bottom: 20px;
          border: 1px solid #ddd;
          padding: 20px;
        }
        .payment-section {
          margin: 30px 0;
          padding: 20px;
          background: #f9f9f9;
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
        <h1>INVOICE</h1>
      </div>

      <div class="details-section">
        <p><strong>Job ID:</strong> {{jobId}}</p>
        <p><strong>Date:</strong> {{date}}</p>
        <p><strong>Customer Name:</strong> {{brandName}}</p>
        <p><strong>Amount Due:</strong> {{currency}} {{amount}}</p>
        <p><strong>Work Location:</strong> {{location}}</p>
        <p><strong>Work Description:</strong> {{description}}</p>
      </div>

      <div class="payment-section">
        <h3>Payment Instructions</h3>
        <p><strong>Account Holder:</strong> Md Oliul Hasan</p>
        <p><strong>IBAN:</strong> GB21TRWI23147023261393</p>
        <p><strong>SWIFT:</strong> TRWIGB2LXXX</p>
        <p><strong>Currencies:</strong> EUR or Equivalent in GBP, USD, CAD, AED, PLN</p>
        <p><strong>Bank Address:</strong> Wise Payments Limited, 56 Shoreditch High Street, London, E1 6JJ, United Kingdom</p>
      </div>

      <div class="footer">
        <p>Please read our terms of service at bookfirstmodels.com/tos</p>
        <p>Send us an email if you have any questions at booking@bookfirstmodels.com</p>
        <p>Thank you for your business.</p>
        <p>Payment due within 30 days of the date of the invoice.</p>
      </div>
    </body>
    </html>
    `;
  }

  generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  }

  async generateInvoice(bookingId, invoiceData) {
    // Log the invoiceData coming in from the front end
    console.log("Invoice Data Received:", invoiceData);
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ValidationError('Booking not found');
    }

    const invoiceNumber = this.generateInvoiceNumber();
    const templateData = {
      invoiceNumber,
      date: new Date().toLocaleDateString(),
      brandName: booking.brandName,
      jobId: booking.jobId,
      bookingDate: new Date(booking.date).toLocaleDateString(),
      location: `${booking.location.city}, ${booking.location.country}`,
      description: invoiceData.description,
      amount: invoiceData.amount,
      currency: invoiceData.currency
    };

    // Log the templateData to verify it contains amount and currency
    console.log("Invoice Template Data:", templateData);

    // Generate HTML using the template
    const template = Handlebars.compile(this.template);
    const html = template(templateData);

    // Generate PDF from HTML
    const pdfBuffer = await new Promise((resolve, reject) => {
      pdf.create(html, { format: 'A4', border: '1cm' }).toBuffer((err, buffer) => {
        if (err) reject(err);
        else resolve(buffer);
      });
    });

    // Update booking with invoice details
    booking.invoice = {
      amount: invoiceData.amount,
      currency: invoiceData.currency,
      description: invoiceData.description,
      number: invoiceNumber,
      generatedDate: new Date()
    };
    await booking.save();

    return {
      html,
      pdfBuffer,
      invoiceNumber
    };
  }
}

module.exports = new InvoiceService();
