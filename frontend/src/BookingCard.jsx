// frontend/src/BookingCard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import axios from 'axios';
import BookingModal from './BookingModal';
import Payout from './Payout';

const StatusBadge = ({ status }) => {
  const colors = {
    requested: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400'
  };

  const capitalize = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  return (
    <span className={`badge ${colors[status.toLowerCase()]}`}>
      {capitalize(status)}
    </span>
  );
};

const StatusUpdateDropdown = ({ booking, onUpdate }) => {
  // Allow "completed" as a possible transition for requested and confirmed bookings.
  const transitions = {
    requested: ['confirmed', 'completed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: ['cancelled'],
    cancelled: []
  };

  const allowedTransitions = transitions[booking.status.toLowerCase()] || [];
  if (allowedTransitions.length === 0) return null;

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    if (!window.confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) {
      return;
    }
    try {
      await axios.put(`/api/bookings/${booking._id}/status`, { status: newStatus });
      onUpdate();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  return (
    <select
      value={booking.status}
      onChange={handleChange}
      className="btn-secondary"
    >
      <option value={booking.status}>
        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
      </option>
      {allowedTransitions.map((status) => (
        <option key={status} value={status}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </option>
      ))}
    </select>
  );
};

const BookingCard = ({ booking, onUpdate }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active tab: "main", "invoice", "payouts"
  const [activeTab, setActiveTab] = useState('main');
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  // This line must be defined so that showTabs is available later.
  const showTabs = user.role === 'admin' || user.role === 'co_admin';

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Styling for tab buttons.
  const tabButtonClass = 'px-4 py-2 rounded focus:outline-none flex-1';
  const activeTabClass = 'bg-blue-500 text-white';
  const inactiveTabClass = 'bg-gray-700 text-gray-300 hover:bg-gray-600';

  // -------------------------------
  // Main Booking Details Content (Re-organized)
  // -------------------------------
  const MainContent = () => (
    <div className="mt-4 grid grid-cols-2 gap-8">
      {/* Left Section: Selected Models */}
      <div className="bg-gray-800 p-4 rounded">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">
          Selected Models
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {booking.portfolios.map((portfolio) => (
            <div
              key={portfolio._id}
              onClick={() => navigate(`/portfolio/${portfolio._id}`)}
              className="cursor-pointer group"
            >
              <div className="aspect-[3/4] relative overflow-hidden rounded-lg">
                <img
                  src={`/api/portfolios/${portfolio._id}/featured-image`}
                  alt={portfolio.modelName}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                  <p className="text-white text-sm">{portfolio.modelName}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Section: Project Details */}
      <div className="bg-gray-800 p-4 rounded space-y-4">
        {showTabs && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">Status:</span>
            <StatusUpdateDropdown booking={booking} onUpdate={onUpdate} />
          </div>
        )}

        <div>
          <p className="text-sm text-gray-400">Brand</p>
          <p className="text-base text-gray-300">{booking.brandName}</p>
          <p className="text-sm text-gray-300">{booking.brandEmail}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">Date</p>
            <p className="text-base text-gray-300">{formatDate(booking.date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Time</p>
            <p className="text-base text-gray-300">{booking.time}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400">Location</p>
          <p className="text-base text-gray-300">{booking.location.streetAddress}</p>
          <p className="text-base text-gray-300">
            {booking.location.city}, {booking.location.country}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">Duration</p>
            <p className="text-base text-gray-300">
              {booking.duration.value} {booking.duration.unit}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Phone</p>
            <p className="text-base text-gray-300">{booking.phone}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400">Work Description</p>
          <p className="text-base text-gray-300 whitespace-pre-line">
            {booking.workDescription}
          </p>
        </div>
      </div>
    </div>
  );

  const InvoiceContent = () => {
    // States for invoice generation and download
    const [invoiceAmount, setInvoiceAmount] = useState(
      booking.invoice?.amount || ''
    );
    const [invoiceCurrency, setInvoiceCurrency] = useState(
      booking.invoice?.currency || 'EUR'
    );
    const [invoiceDescription, setInvoiceDescription] = useState(
      booking.invoice?.description || booking.workDescription || ''
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [invoiceNumber, setInvoiceNumber] = useState(
      booking.invoice?.number || ''
    );
    const [downloadLoading, setDownloadLoading] = useState(false);
  
    // Update states when booking.invoice changes
    useEffect(() => {
      if (booking.invoice) {
        setInvoiceAmount(booking.invoice.amount || '');
        setInvoiceCurrency(booking.invoice.currency || 'EUR');
        setInvoiceDescription(
          booking.invoice.description || booking.workDescription || ''
        );
        setInvoiceNumber(booking.invoice.number || '');
      }
    }, [booking.invoice]);
  
    const handleGenerateInvoice = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      try {
        console.log('Generating invoice for booking:', booking._id);
        const response = await axios.post(`/api/invoices/generate/${booking._id}`, {
          amount: parseFloat(invoiceAmount),
          currency: invoiceCurrency,
          description: invoiceDescription
        });
        console.log('Invoice response:', response.data);
        if (response.data.status === 'success' && response.data.data.invoiceNumber) {
          setInvoiceNumber(response.data.data.invoiceNumber);
          if (onUpdate) onUpdate();
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err) {
        console.error('Invoice generation error:', err);
        setError(err.response?.data?.message || 'Failed to generate invoice');
      } finally {
        setLoading(false);
      }
    };
  
    const handleDownloadInvoice = async () => {
      try {
        setDownloadLoading(true);
        console.log('Downloading invoice for booking:', booking._id);
        const response = await axios.get(`/api/invoices/download/${booking._id}`, {
          params: {
            amount: invoiceAmount,
            currency: invoiceCurrency,
            description: invoiceDescription
          },
          responseType: 'blob'
        });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice-${booking.jobId}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Download error:', err);
        setError('Failed to download invoice');
      } finally {
        setDownloadLoading(false);
      }
    };
  
    return (
      <div className="grid grid-cols-2 gap-8 mt-4">
        {/* Left Section: Invoice Generation Form */}
        <div className="bg-gray-800 p-4 rounded">
          <form onSubmit={handleGenerateInvoice}>
            {error && <div className="alert-error mb-4">{error}</div>}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300">Amount</label>
              <input
                type="number"
                step="0.01"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                className="input mt-1 w-full"
                required
              />
            </div>
  
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300">Currency</label>
              <select
                value={invoiceCurrency}
                onChange={(e) => setInvoiceCurrency(e.target.value)}
                className="select mt-1 w-full"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="CAD">CAD</option>
                <option value="GBP">GBP</option>
                <option value="PLN">PLN</option>
                <option value="AED">AED</option>
              </select>
            </div>
  
            <div className="mb-4">
  <label className="block text-sm font-medium text-gray-300">Description</label>
  <div className="relative">
    <textarea
      value={invoiceDescription}
      onChange={(e) => setInvoiceDescription(e.target.value)}
      maxLength={500}
      rows="3"
      className="textarea mt-1 w-full"
      required
    ></textarea>
    <button
      type="button"
      onClick={async () => {
        try {
          const response = await axios.post('/api/ai/generate-invoice-description', {
            existingText: invoiceDescription
          });
          setInvoiceDescription(response.data.text);
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to generate description');
        }
      }}
      className="ai-generate-btn"
      disabled={loading}
    >
      {loading ? (
        <>
          <div className="spinner-sm" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>AI Generate</span>
        </>
      )}
    </button>
  </div>
  <span className="text-sm text-gray-400">
    {invoiceDescription.length}/500
  </span>
</div>
  
            <button type="submit" className="btn-secondary" disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner-sm" />
                  <span>Generating...</span>
                </div>
              ) : (
                'Generate Invoice'
              )}
            </button>
          </form>
        </div>
  
        {/* Right Section: Sleek Download Icon and Glass Button */}
        <div className="bg-gray-800 p-4 rounded flex items-center justify-center">
          {invoiceNumber ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              {/* Big Sleek Download Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-16 h-16 text-gray-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                />
              </svg>
              {/* Sleek Glass Button */}
              <button
                onClick={handleDownloadInvoice}
                type="button"
                disabled={downloadLoading}
                className="px-8 py-3 rounded-md border border-white border-opacity-20 text-white text-lg font-semibold bg-white bg-opacity-10 backdrop-blur-md hover:bg-opacity-20 transition-colors"
              >
                {downloadLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      ></path>
                    </svg>
                    Downloading...
                  </span>
                ) : (
                  'Download Invoice'
                )}
              </button>
            </div>
          ) : (
            <div className="text-gray-400 text-center">
              Generate an invoice to enable download.
            </div>
          )}
        </div>
      </div>
    );
  };
  

  return (
    <div className="card bg-gray-900/50 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-700 padding-container flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="h3">Job #{booking.jobId}</h3>
          <StatusBadge status={booking.status} />
        </div>
        {(user.role === 'admin' || user.role === 'co_admin') && (
          <button
            onClick={() => setEditModalOpen(true)}
            className="btn btn-secondary"          >
            Edit Booking
          </button>
        )}
      </div>

      {/* Tab Bar for admin/co_admin */}
      {showTabs && (
        <div className="flex gap-2 p-4 bg-gray-800">
          <button
            onClick={() => setActiveTab('main')}
            className={`${tabButtonClass} ${
              activeTab === 'main' ? activeTabClass : inactiveTabClass
            }`}
          >
            Main
          </button>
          <button
            onClick={() => setActiveTab('invoice')}
            className={`${tabButtonClass} ${
              activeTab === 'invoice' ? activeTabClass : inactiveTabClass
            }`}
          >
            Invoice
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`${tabButtonClass} ${
              activeTab === 'payouts' ? activeTabClass : inactiveTabClass
            }`}
          >
            Payouts
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="padding-container">
        {showTabs ? (
          <>
            {activeTab === 'main' && <MainContent />}
            {activeTab === 'invoice' && <InvoiceContent />}
            {activeTab === 'payouts' && <Payout booking={booking} onUpdate={onUpdate} />}
          </>
        ) : (
          <MainContent />
        )}
      </div>

      {/* Edit Booking Modal */}
      {isEditModalOpen && (
        <BookingModal
          isOpen={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
          booking={booking}
          isEditing={true}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};

export default BookingCard;
