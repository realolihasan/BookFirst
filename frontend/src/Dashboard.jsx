// frontend/src/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this at the top
import axios from 'axios';
import { useAuth } from './AuthContext';
import BookingCard from './BookingCard';

const FilterButton = ({ status, activeFilter, onClick, count }) => (
  <button
    onClick={() => onClick(status)}
    className={`
      btn flex items-center justify-center gap-2
      ${activeFilter === status ? 'btn-primary' : 'btn-secondary'}
    `}
  >
    {status.charAt(0).toUpperCase() + status.slice(1)}
    {count > 0 && (
      <span className={`
        px-2 py-0.5 text-sm rounded-full
        ${activeFilter === status
          ? 'bg-black/20 text-black'
          : 'bg-white/20 text-white'}
      `}>
        {count}
      </span>
    )}
  </button>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('requested');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 10;
  const navigate = useNavigate();


  const BF_STATUS = {
    REQUESTED: 'requested',
    CONFIRMED: 'confirmed', 
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/bookings');
      setBookings(response.data.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getFilteredBookings = () => {
    let filtered = [...bookings];

    // Role-based filtering
    if (user.role === 'brand') {
      filtered = filtered.filter(b => b.brandId === user._id);
    }

    if (user.role === 'model') {
      filtered = filtered.filter(b => 
        b.portfolios.some(p => p._id === user.portfolioId) && 
        b.status !== 'requested'
      );
    }

    // Status filtering
    filtered = filtered.filter(b => b.status === filter);

    return filtered;
  };

  const getStatusCount = (status) => {
    return bookings.filter(b => b.status === status).length;
  };

  const filteredBookings = getFilteredBookings();
  
  // Pagination calculations
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="page-container">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center margin-stack">
          <h1 className="h1">Dashboard</h1>
          {user.role === 'admin' && (
          <button 
            onClick={() => navigate('/users')} // Changed from setUserModalOpen(true)
            className="btn-primary"
          >
            Manage Users
          </button>
        )}
        </div>

{/* Filters */}
<div className="bg-black/20 backdrop-blur-md border border-white/10 p-4 rounded-lg shadow-lg margin-stack">
  <div className="flex flex-wrap gap-3">
    {Object.values(BF_STATUS).map(status => (
      <FilterButton 
        key={status}
        status={status}
        activeFilter={filter}
        onClick={setFilter}
        count={getStatusCount(status)}
      />
    ))}
  </div>
</div>

        {/* Bookings Grid */}
{loading ? (
  <div className="flex-center py-8">
    <div className="spinner-lg" />
  </div>
) : currentBookings.length > 0 ? (
  <>
    <div className="space-y-6">
      {currentBookings.map(booking => (
        <BookingCard 
          key={booking._id}
          booking={booking}
          onUpdate={fetchBookings}
        />
      ))}
    </div>

    {/* Pagination */}
    {totalPages > 1 && (
      <div className="flex justify-center gap-2 mt-8">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-6 py-2 rounded-lg transition-all duration-300
                     backdrop-blur-md active:scale-95
                     bg-black/80 text-white border border-white/30
                     hover:bg-black hover:border-white/50 hover:shadow-purple-500/30
                     ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
          <button
            key={number}
            onClick={() => paginate(number)}
            className={`px-6 py-2 rounded-lg transition-all duration-300
                       backdrop-blur-md active:scale-95 ${
              currentPage === number
                ? 'bg-white/80 text-black border border-black/30 hover:bg-white hover:border-black/50 hover:shadow-purple-500/30'
                : 'bg-black/80 text-white border border-white/30 hover:bg-black hover:border-white/50 hover:shadow-purple-500/30'
            }`}
          >
            {number}
          </button>
        ))}
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-6 py-2 rounded-lg transition-all duration-300
                     backdrop-blur-md active:scale-95
                     bg-black/80 text-white border border-white/30
                     hover:bg-black hover:border-white/50 hover:shadow-purple-500/30
                     ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Next
        </button>
      </div>
    )}
  </>
) : (
  <div className="bg-black/20 backdrop-blur-md border border-white/10 p-4 rounded-lg text-center">
    <p className="text-gray-400">No bookings found</p>
  </div>
)}

      </div>
    </div>
  );
};

export default Dashboard;