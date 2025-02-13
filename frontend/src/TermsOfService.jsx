// Path: frontend/src/TermsOfService.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
  return (
    <div className="page-container">
      <div className="content-container max-w-3xl">
        <Link to="/" className="btn-secondary inline-block mb-8">← Back to Home</Link>
        
        <div className="card padding-container space-lg">
          <h1 className="h1 mb-8">Terms of Service</h1>

          <div className="space-lg">
            <section className="space-md">
              <h2 className="h2">1. Agreement to Terms</h2>
              <p className="body">
                By accessing our services, you agree to be bound by these Terms of Service and our Privacy Policy.
              </p>
            </section>

            <section className="space-md">
              <h2 className="h2">2. Service Description</h2>
              <p className="body">
                BOOKFIRST Model Agency provides model representation, booking services, and portfolio management 
                for professional models and clients in the fashion industry.
              </p>
            </section>

            <section className="space-md">
              <h2 className="h2">3. Model Representation</h2>
              <p className="body">
                Our agency acts as an intermediary between models and clients. We:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>Negotiate contracts and bookings</li>
                <li>Manage model portfolios</li>
                <li>Handle professional communications</li>
                <li>Process payments and commissions</li>
              </ul>
            </section>

            <section className="space-md">
              <h2 className="h2">4. Rights and Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>Models must provide accurate information</li>
                <li>Models must maintain professional conduct</li>
                <li>Agency will promote models professionally</li>
                <li>Agency will protect model's interests</li>
              </ul>
            </section>

            <section className="space-md">
              <h2 className="h2">5. Commercial Terms</h2>
              <p className="body">
                Commission rates, payment terms, and booking conditions are specified in individual model contracts.
              </p>
            </section>

            <section className="space-md">
              <h2 className="h2">6. Governing Law</h2>
              <p className="body">
                These terms are governed by European Union law and the laws of the country where our agency is registered.
              </p>
            </section>

            <section className="space-md">
              <h2 className="h2">7. Contact</h2>
              <p className="body">
                For any inquiries regarding these terms, contact us at:{' '}
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

export default TermsOfService;