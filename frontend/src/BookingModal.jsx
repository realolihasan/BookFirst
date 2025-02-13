// frontend/src/BookingModal.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BookingModal = ({
  isOpen,
  onClose,
  selectedPortfolios = [],
  isEditing = false,
  booking = null,
  onUpdate,
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(
    isEditing
      ? {
          brandName: booking.brandName,
          brandEmail: booking.brandEmail,
          date: new Date(booking.date).toISOString().split('T')[0],
          time: booking.time,
          duration: booking.duration,
          location: booking.location,
          phone: booking.phone,
          workDescription: booking.workDescription,
        }
      : {
          brandName: '',
          brandEmail: '',
          date: '',
          time: '',
          duration: {
            value: 1,
            unit: 'hours',
          },
          location: {
            streetAddress: '',
            city: '',
            country: '',
          },
          phone: '',
          workDescription: '',
        }
  );

  const [availablePortfolios, setAvailablePortfolios] = useState([]);
  const [selectedModels, setSelectedModels] = useState(
    isEditing ? booking.portfolios : selectedPortfolios
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [workDescriptionCount, setWorkDescriptionCount] = useState(
    isEditing ? booking.workDescription.length : 0
  );

  useEffect(() => {
    // Always fetch portfolios.
    fetchPortfolios();
    if (isEditing && booking?.portfolios) {
      setSelectedModels(booking.portfolios);
    }
  }, [isEditing, booking]);

  const fetchPortfolios = async () => {
    try {
      const response = await axios.get('/api/portfolios');
      setAvailablePortfolios(response.data.data || []);
    } catch (err) {
      setError('Failed to load portfolios');
      console.error('Portfolio fetch error:', err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedModels.length === 0) {
      setError('Please select at least one model');
      return;
    }

    if (formData.workDescription.length > 500) {
      setError('Work description must not exceed 500 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const bookingData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        portfolios: selectedModels.map((p) => p._id),
      };

      if (isEditing) {
        await axios.put(`/api/bookings/${booking._id}`, bookingData);
      } else {
        await axios.post('/api/bookings', bookingData);
      }

      setSuccess(true);
      if (onUpdate) onUpdate();

      setTimeout(() => {
        onClose();
        if (!isEditing) {
          navigate('/dashboard');
        }
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to ${isEditing ? 'update' : 'create'} booking`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleModelSelection = (portfolio) => {
    setSelectedModels((prev) =>
      prev.find((p) => p._id === portfolio._id)
        ? prev.filter((p) => p._id !== portfolio._id)
        : [...prev, portfolio]
    );
  };

  return (
    <div
      className="modal"
      onClick={(e) => {
        if (e.target.classList.contains('modal')) onClose();
      }}
    >
      <div className="modal-content max-w-6xl">
        <div className="modal-header">
          <h2 className="h2">
            {isEditing ? 'Edit Booking' : 'Request a Booking'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ×
          </button>
        </div>

        {success && (
          <div className="alert-success mb-4">
            Booking {isEditing ? 'updated' : 'created'} successfully! Redirecting...
          </div>
        )}

        {error && <div className="alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Section - Model Selection */}
            <div className="card bg-gray-800/30 h-full">
              <div className="card-body">
                <h3 className="h3 mb-2">Select Models</h3>
                <div className="grid grid-cols-3 gap-2 max-h-[600px] overflow-y-auto">
                  {availablePortfolios.map((portfolio) => (
                    <div
                      key={portfolio._id}
                      className={`card cursor-pointer ${
                        selectedModels.find((p) => p._id === portfolio._id)
                          ? 'ring-2 ring-purple-500'
                          : ''
                      }`}
                      onClick={() => toggleModelSelection(portfolio)}
                    >
                      <div className="aspect-[3/4] relative">
                        <img
                          src={`/api/portfolios/${portfolio._id}/featured-image`}
                          alt={portfolio.modelName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                          <p className="text-white font-medium">
                            {portfolio.modelName}
                          </p>
                          <p className="text-sm text-gray-300">
                            {portfolio.expertise}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Section - Booking Details */}
            <div className="card bg-gray-800/30">
              <div className="card-body space-y-4">
                <h3 className="h3 mb-2">Booking Details</h3>

                {/* Brand Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="label">Your Name</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.brandName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          brandName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Your Email</label>
                    <input
                      type="email"
                      className="input"
                      value={formData.brandEmail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          brandEmail: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    {/* Date */}
                    <div className="form-group">
                      <label className="label">Date</label>
                      <input
                        type="date"
                        className="input"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            date: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    {/* Time */}
                    <div className="form-group">
                      <label className="label">Time</label>
                      <input
                        type="time"
                        className="input"
                        value={formData.time}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            time: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    {/* Duration */}
                    <div className="form-group">
                      <label className="label">Duration</label>
                      <input
                        type="number"
                        min="1"
                        className="input"
                        value={formData.duration.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            duration: {
                              ...formData.duration,
                              value: e.target.value,
                            },
                          })
                        }
                        required
                      />
                    </div>

                    {/* Unit */}
                    <div className="form-group">
                      <label className="label">Unit</label>
                      <select
                        className="select"
                        value={formData.duration.unit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            duration: {
                              ...formData.duration,
                              unit: e.target.value,
                            },
                          })
                        }
                        required
                      >
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  </div>


                {/* Work Description */}
  
                <div className="form-group">
  <label className="label">Work Description</label>
  <div className="relative">
    <textarea
      className="textarea h-[85px]"
      value={formData.workDescription}
      onChange={(e) => {
        setFormData({
          ...formData,
          workDescription: e.target.value,
        });
        setWorkDescriptionCount(e.target.value.length);
      }}
      maxLength={500}
      placeholder="Describe the work (max 500 characters)"
      required
    />
    <button
      type="button"
      onClick={async () => {
        try {
          const response = await axios.post('/api/ai/generate-work-description', {
            existingText: formData.workDescription
          });
          setFormData(prev => ({
            ...prev,
            workDescription: response.data.text
          }));
          setWorkDescriptionCount(response.data.text.length);
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to generate description');
        }
      }}
      className="ai-generate-btn"
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <>
          <div className="spinner-sm" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Make it Objective</span>
        </>
      )}
    </button>
  </div>
  <span className="text-sm text-gray-400">
    {workDescriptionCount}/500
  </span>
</div>

               {/* Location & Contact */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="label">Street Address of the Job</label>
                      <input
                        type="text"
                        className="input"
                        value={formData.location.streetAddress}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            location: {
                              ...formData.location,
                              streetAddress: e.target.value,
                            },
                          })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">City</label>
                      <input
                        type="text"
                        className="input"
                        value={formData.location.city}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            location: {
                              ...formData.location,
                              city: e.target.value,
                            },
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="label">Country</label>
                      <input
                        type="text"
                        className="input"
                        value={formData.location.country}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            location: {
                              ...formData.location,
                              country: e.target.value,
                            },
                          })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">Phone Number</label>
                      <input
                        type="tel"
                        className="input"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phone: e.target.value,
                          })
                        }
                        pattern="[0-9+\-\s]+"
                        placeholder="+(Code) 234 567 8900"
                        required
                      />
                    </div>
                  </div>
                </div>
                </div>
                </div>
                </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || selectedModels.length === 0}
            >
              {isSubmitting ? (
                <div className="flex-center gap-2">
                  <div className="spinner-sm" />
                  <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                </div>
              ) : isEditing ? (
                'Update Booking'
              ) : (
                'Create Booking'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
