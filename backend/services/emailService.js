// backend/services/emailService.js

// backend/services/emailService.js

const nodemailer = require('nodemailer');
const { ValidationError } = require('../middleware/errorMiddleware');

class EmailService {
  constructor() {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email configuration missing. Check environment variables.');
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true, // set to true for port 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async sendContactEmail(data) {
    const { name, email, phone, message, to } = data;

    if (!name || !email || !phone || !message || !to) {
      throw new ValidationError('Missing required fields');
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Phone validation - basic check for numbers, +, -, and spaces
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(phone)) {
      throw new ValidationError('Invalid phone format');
    }

    // Create email content
    const mailOptions = {
      from: `"BOOKFIRST Contact" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'New Contact Form Submission - BOOKFIRST',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 10px 0;"><strong>Phone:</strong> ${phone}</p>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #555;">Message:</h3>
            <p style="white-space: pre-line; background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
              ${message}
            </p>
          </div>

          <div style="font-size: 12px; color: #666; margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee;">
            <p>This email was sent from the BOOKFIRST website contact form.</p>
          </div>
        </div>
      `
    };

    try {
      // Verify connection configuration
      await this.transporter.verify();

      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}

module.exports = new EmailService();