// Path: frontend/src/PrivacyPolicy.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="page-container">
      <div className="content-container max-w-3xl">
        <Link to="/" className="btn-secondary inline-block mb-8">← Back to Home</Link>
        
        <div className="card padding-container space-lg">
          <h1 className="h1 mb-8">Privacy Policy</h1>

          <div className="space-lg">
            <section className="space-md">
              <h2 className="h2">1. Introduction</h2>
              <p className="body">
                BOOKFIRST Model Agency ("we", "our", or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, and protect your personal information.
              </p>
            </section>

            <section className="space-md">
              <h2 className="h2">2. Information We Collect</h2>
              <p className="body">We collect information including:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>Personal identification information (name, email, phone number)</li>
                <li>Professional information (portfolio, measurements, experience)</li>
                <li>Images and media content</li>
                <li>Communications between you and our agency</li>
              </ul>
            </section>

            <section className="space-md">
              <h2 className="h2">3. How We Use Your Information</h2>
              <p className="body">We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>Represent models to potential clients</li>
                <li>Process bookings and payments</li>
                <li>Maintain and update portfolios</li>
                <li>Communicate about opportunities</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="space-md">
              <h2 className="h2">4. GDPR Compliance</h2>
              <p className="body">
                Under GDPR, you have rights including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>Right to access your data</li>
                <li>Right to rectification</li>
                <li>Right to erasure</li>
                <li>Right to data portability</li>
              </ul>
            </section>

            <section className="space-md">
              <h2 className="h2">5. Contact Us</h2>
              <p className="body">
                For privacy-related inquiries, contact us at:{' '}
                <a href="mailto:booking@bookfirstmodels.com" className="text-purple-400 hover:text-purple-300">
                  booking@bookfirstmodels.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;