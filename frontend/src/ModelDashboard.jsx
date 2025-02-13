import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import axios from 'axios';
import PortfolioCard from './PortfolioCard';

const ModelDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const bookingsPerPage = 5;
  const [downloading, setDownloading] = useState(false);


  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsResponse, portfolioResponse] = await Promise.all([
        axios.get('/api/bookings'),
        axios.get(`/api/portfolios/${user.portfolioId}`)
      ]);
      
      // Filter bookings for confirmed and completed status
      const modelBookings = bookingsResponse.data.data.filter(booking => 
        booking.portfolios.some(p => p._id === user.portfolioId) && 
        ['confirmed', 'completed'].includes(booking.status)
      );
      
      setBookings(modelBookings);
      setPortfolio(portfolioResponse.data.data);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStatement = async (bookingId, recipientId) => {
    try {
      const response = await axios.get(
        `/api/payouts/download/${bookingId}/${user._id}`, // Use logged-in user's ID
        { responseType: 'blob' }
      );
  
      // Check if the response is actually a PDF
      if (response.headers['content-type'] === 'application/pdf') {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payout-statement.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Handle error response
        const reader = new FileReader();
        reader.onload = () => {
          const errorResponse = JSON.parse(reader.result);
          setError(errorResponse.message || 'Failed to download statement');
        };
        reader.readAsText(response.data);
      }
    } catch (err) {
      console.error('Download error:', err);
      setError(err.response?.data?.message || 'Failed to download statement');
    }
  };

  if (loading) {
    return (
      <div className="page-container flex-center">
        <div className="spinner-lg" />
      </div>
    );
  }

  const paginatedBookings = bookings.slice(
    (page - 1) * bookingsPerPage, 
    page * bookingsPerPage
  );

  // Earlier code remains same, just update the JSX part:

  return (
    <div className="page-container">
      <div className="container mx-auto px-4">
        <h1 className="h1 mb-8">Model Dashboard</h1>

        {/* Portfolio Card - Made smaller */}
        {portfolio && (
          <div className="mb-12 max-w-xs">
            <PortfolioCard model={portfolio} />
          </div>
        )}

        {/* Bookings Section */}
        <div className="space-y-6">
          <h2 className="h2">Your Bookings</h2>
          
          {paginatedBookings.map(booking => (
  <div key={booking._id} className="bg-black/20 backdrop-blur-md border border-white/10 p-6 rounded-lg space-y-6">
    <div className="flex justify-between items-center">
      <h3 className="text-xl text-white font-semibold">Booking #{booking.jobId}</h3>
      <span className={`badge ${
        booking.status === 'completed' ? 'badge-success' : 'badge-info'
      }`}>
        {booking.status}
      </span>
    </div>

    <div className="grid grid-cols-2 gap-8">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-400">Brand</p>
          <p className="text-base text-white">{booking.brandName}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">Date</p>
            <p className="text-base text-white">
              {new Date(booking.date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Time</p>
            <p className="text-base text-white">{booking.time}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400">Contact</p>
          <p className="text-base text-white">{booking.phone}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400">Location</p>
          <p className="text-base text-white">{booking.location.streetAddress}</p>
          <p className="text-base text-white">
            {booking.location.city}, {booking.location.country}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-400">Work Description</p>
          <p className="text-base text-white whitespace-pre-line">
            {booking.workDescription}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {booking.payoutStatements?.some(payout => payout.recipientId === user._id) ? (
          booking.payoutStatements
            .filter(payout => payout.recipientId === user._id)
            .map(payout => (
              <div key={payout._id} className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-lg">
                <div className="mb-4">
                  <p className="text-sm text-gray-400">Your Payment</p>
                  <p className="text-2xl font-semibold text-white">
                    {booking.invoice?.currency} {payout.amount}
                  </p>
                </div>

                <div className="mb-12">
  <p className="text-sm text-gray-400 mb-6">Payment Status</p>
  <span className={`badge text-base px-4 py-2 ${
    payout.status === 'paid' 
      ? 'badge-success' 
      : 'badge-warning'
  }`}>
    {payout.status === 'paid' ? 'Paid' : 'Pending'}
  </span>
</div>

                {payout.statementNumber ? (

                // In your component:
                <button
                  onClick={() => {
                    setDownloading(true);
                    handleDownloadStatement(booking._id, user._id)
                      .finally(() => setDownloading(false));
                  }}
                  disabled={downloading}
                  className="px-6 py-2 rounded-lg transition-all duration-300
                           backdrop-blur-md active:scale-95
                           bg-black/80 text-white border border-white/30 
                           hover:bg-black hover:border-white/50 hover:shadow-purple-500/30
                           w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Downloading...</span>
                    </div>
                  ) : (
                    'Download Statement'
                  )}
                </button>

                ) : (
                  <p className="text-center text-gray-400 py-2">
                    Statement Not Generated Yet
                  </p>
                )}
              </div>
            ))
        ) : (
          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-lg">
            <p className="text-center text-gray-400">
              Payout Details Not Generated Yet
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
))}

          {/* Pagination */}
{bookings.length > bookingsPerPage && (
  <div className="flex justify-center gap-2 mt-8">
    {Array.from({ 
      length: Math.ceil(bookings.length / bookingsPerPage) 
    }).map((_, index) => (
      <button
        key={index}
        onClick={() => setPage(index + 1)}
        className={`px-6 py-2 rounded-lg transition-all duration-300
                   backdrop-blur-md active:scale-95 ${
          page === index + 1 
            ? 'bg-white/80 text-black border border-black/30 hover:bg-white hover:border-black/50 hover:shadow-purple-500/30' 
            : 'bg-black/80 text-white border border-white/30 hover:bg-black hover:border-white/50 hover:shadow-purple-500/30'
        }`}
      >
        {index + 1}
      </button>
    ))}
  </div>
)}

          {bookings.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No bookings found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelDashboard;