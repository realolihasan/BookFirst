// Path: frontend/src/Home.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './AuthContext';
import BookingModal from './BookingModal';
import PortfolioCard from './PortfolioCard';

const SimpleContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await axios.post('/api/send-email', {
        ...formData,
        to: 'kingkongwarsaw@gmail.com'
      });
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
      {/* Left Section */}
      <div className="flex flex-col justify-start">
        <h2 className="text-3xl text-white font-semibold mb-4">Contact</h2>
        <h3 className="text-xl text-gray-300 mb-6">Get in touch with our team</h3>
        <p className="text-gray-400 leading-relaxed">
          We're here to help bring your vision to life. Please share your project details 
          including work requirements, location, and duration. Our team will get back to 
          you within 24 hours to discuss how we can collaborate on your project.
        </p>
      </div>
  {/* Right Section */}
<div className="flex flex-col">
  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
    <input
      type="text"
      placeholder="Your Name or Brand Name"
      value={formData.name}
      onChange={(e) => setFormData({...formData, name: e.target.value})}
      className="w-full px-4 py-3 bg-black/20 border border-white/30 rounded-lg 
                 backdrop-blur-md text-white
                 focus:outline-none focus:border-white/50 focus:shadow-lg
                 transition-all duration-300"
      required
    />
    <input
      type="email"
      placeholder="Your Email"
      value={formData.email}
      onChange={(e) => setFormData({...formData, email: e.target.value})}
      className="w-full px-4 py-3 bg-black/20 border border-white/30 rounded-lg 
                 backdrop-blur-md text-white
                 focus:outline-none focus:border-white/50 focus:shadow-lg
                 transition-all duration-300"
      required
    />
    <input
      type="tel"
      placeholder="Phone Number (with country code)"
      value={formData.phone}
      onChange={(e) => setFormData({...formData, phone: e.target.value})}
      className="w-full px-4 py-3 bg-black/20 border border-white/30 rounded-lg 
                 backdrop-blur-md text-white
                 focus:outline-none focus:border-white/50 focus:shadow-lg
                 transition-all duration-300"
      required
    />
    <div className="flex flex-col">
      <textarea
        placeholder="Project Details"
        value={formData.message}
        onChange={(e) => {
          if (e.target.value.length <= 500) {
            setFormData({...formData, message: e.target.value});
          }
        }}
        maxLength={500}
        className="w-full px-4 py-3 bg-black/20 border border-white/30 rounded-lg 
                   backdrop-blur-md text-white h-32 resize-none
                   focus:outline-none focus:border-white/50 focus:shadow-lg
                   transition-all duration-300"
        required
      />
      <span className="text-sm text-gray-400 mt-1 self-end">
        {formData.message.length}/500
      </span>
    </div>
    <button 
      type="submit" 
      className="w-full px-6 py-2 rounded-lg transition-all duration-300
                 shadow-lg shadow-white/10 backdrop-blur-md active:scale-95
                 bg-white/80 text-black border border-black/30 
                 hover:bg-white hover:border-black/50 hover:shadow-xl"
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <span>Sending...</span>
        </div>
      ) : 'Send Message'}
    </button>
    {status === 'success' && (
      <div className="px-4 py-3 bg-green-500/20 border border-green-400/30 
                     text-green-400 rounded-lg backdrop-blur-md">
        Message sent successfully!
      </div>
    )}
    {status === 'error' && (
      <div className="px-4 py-3 bg-red-500/20 border border-red-400/30 
                     text-red-400 rounded-lg backdrop-blur-md">
        Failed to send message. Please try again.
      </div>
    )}
  </form>
</div>
  </div>
  );
};

const Home = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [portfoliosError, setPortfoliosError] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const contactFormRef = useRef(null);
  const navigate = useNavigate();
  const { user, login } = useAuth();

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/portfolios');
        setPortfolios(response.data.data || []);
        setPortfoliosError(null);
      } catch (err) {
        setPortfoliosError('Failed to load portfolios');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolios();
  }, []);

  const handleBookingClick = () => {
    setIsBookingModalOpen(true);
  };

  const memoizedPortfolios = useMemo(() => portfolios, [portfolios]);

  const scrollToContact = () => {
    contactFormRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  const fashionPortfolios = memoizedPortfolios.filter(p =>
    ['Catwalk', 'High Fashion'].includes(p.expertise)
  );
  const commercialPortfolios = memoizedPortfolios.filter(p =>
    ['Catalog', 'Influencer'].includes(p.expertise)
  );
  const specialtyPortfolios = memoizedPortfolios.filter(p =>
    ['Acting', 'Fitness', 'Glamour'].includes(p.expertise)
  );

  if (isLoading) {
    return (
      <div className="page-container flex-center">
        <div className="spinner-lg" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="section flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2 image-container">
            <img
              src="/bfm.jpg"
              alt="Hero"
              className="image-fill rounded-xl hover-brightness"
              onError={(e) => e.target.src = '/fallback-hero.jpg'}
            />
          </div>
  
          <div className="w-full md:w-1/2 space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-5xl font-bold bg-gradient-to-r from-white to-[#f8f9fa] bg-clip-text text-transparent">
                BOOKFIRST
              </h1>
              <p className="text-gray-400 mt-2 tracking-[1.05em]">M  O  D  E  L  S</p>
              <p className="body">
                Discover exceptional talent for your next project.
                Our diverse portfolio of professional models brings your vision to life.
              </p>
            </div>
  
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={scrollToContact}
                className="btn btn-secondary"
              >
                Send an Inquiry
              </button>
              <button
                onClick={handleBookingClick}
          className="btn btn-primary"
              >
                Book a Model
              </button>
            </div>
  
            {error && (
              <div className="px-4 py-3 bg-red-500/20 border border-red-400/30 
                             text-red-400 rounded-lg backdrop-blur-md flex justify-between items-center">
                {error}
                <button 
                  onClick={() => setError(null)}
                  className="ml-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Portfolio Sections */}
        {[
          { title: 'Fashion', data: fashionPortfolios },
          { title: 'Commercial', data: commercialPortfolios },
          { title: 'Specialty', data: specialtyPortfolios }
        ].map(section => section.data.length > 0 && (
          <section key={section.title} className="section">
            <div className="margin-stack">
              <h2 className="h2">{section.title}</h2>
              <p className="subtitle">Explore our {section.title.toLowerCase()} portfolio</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {section.data.map(portfolio => (
                <PortfolioCard key={portfolio._id} model={portfolio} />
              ))}
            </div>
          </section>
        ))}

                {/* Contact Form Section */}
        <section id="contact-section" ref={contactFormRef} className="section">
          <SimpleContactForm />
        </section>

        {/* Booking Modal */}
        {isBookingModalOpen && (
          <BookingModal
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};


export const scrollToContact = () => {
  document.getElementById('contact-section').scrollIntoView({ 
    behavior: 'smooth',
    block: 'start'
  });
};

export default Home;