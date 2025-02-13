// Path: frontend/src/AddPortfolioModal.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

axios.defaults.withCredentials = true;

const AddPortfolioModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    modelName: '',
    expertise: '',
    height: '',
    weight: '',
    chest: '',
    waist: '',
    bio: '',
    instagramHandle: '',
  });

  const [files, setFiles] = useState({
    featuredImage: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [bioCount, setBioCount] = useState(0);

  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'bio') {
      setBioCount(value.length);
    }
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (name === 'featuredImage') {
      setFiles(prev => ({
        ...prev,
        featuredImage: [selectedFiles[0]]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
  
    if (!formData.modelName || !formData.expertise || !files.featuredImage[0]) {
      setError('Please fill all required fields.');
      setIsSubmitting(false);
      return;
    }
  
    const formDataToSend = new FormData();
  
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'instagramHandle' && !value) return;
      if (['height', 'weight', 'chest', 'waist'].includes(key)) {
        formDataToSend.append(key, Number(value));
      } else {
        formDataToSend.append(key, value);
      }
    });
  
    if (files.featuredImage[0]) {
      formDataToSend.append('featuredImage', files.featuredImage[0]);
    }
  
    try {
      const response = await axios.post('/api/portfolios', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess(true);
      
      // Fix: Check response data structure and access id correctly
      const portfolioId = response.data.data._id; // or response.data.data.id depending on your API response
      
      setTimeout(() => {
        onClose();
        navigate(`/portfolio/${portfolioId}`);
      }, 1500);
  
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create portfolio');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal"
      onClick={(e) => {
        if (e.target.classList.contains('modal')) {
          onClose();
        }
      }}
    >
      <div className="modal-content">
        <div className="modal-header flex justify-between items-center">
          <h2 className="h2">Add New Portfolio</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">×</button>
        </div>

        {success && (
          <div className="alert-success mb-4">
            Portfolio created successfully! Redirecting...
          </div>
        )}

        {error && <div className="alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Basic Information Section */}
            <div className="card bg-gray-800/30">
              <div className="card-body">
                <h3 className="h3 mb-4">Basic Information</h3>

                <div className="form-group space-y-1 mb-4">
                  <label className="label">Model Name</label>
                  <input
                    type="text"
                    name="modelName"
                    className="input"
                    placeholder="Enter model name"
                    value={formData.modelName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group space-y-1 mb-4">
                  <label className="label">Expertise</label>
                  <select
                    name="expertise"
                    className="select"
                    value={formData.expertise}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Expertise</option>
                    {[
                      "Catwalk",
                      "High Fashion",
                      "Catalog",
                      "Influencer",
                      "Acting",
                      "Fitness",
                      "Glamour"
                    ].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group space-y-1">
                    <label className="label">Height (cm)</label>
                    <input
                      type="number"
                      name="height"
                      className="input"
                      placeholder="Enter height in cm"
                      value={formData.height}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group space-y-1">
                    <label className="label">Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      className="input"
                      placeholder="Enter weight in kg"
                      value={formData.weight}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group space-y-1">
                    <label className="label">Chest (cm)</label>
                    <input
                      type="number"
                      name="chest"
                      className="input"
                      placeholder="Enter chest measurement in cm"
                      value={formData.chest}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group space-y-1">
                    <label className="label">Waist (cm)</label>
                    <input
                      type="number"
                      name="waist"
                      className="input"
                      placeholder="Enter waist measurement in cm"
                      value={formData.waist}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Details & Media Section */}
            <div className="card bg-gray-800/30">
              <div className="card-body">
                <h3 className="h3 mb-4">Details & Media</h3>

  
  
                <div className="form-group space-y-1">
  <label className="label">Bio</label>
  <div className="relative">
    <textarea
      name="bio"
      className="textarea h-32"
      placeholder="Enter a short bio (max 250 characters)"
      value={formData.bio}
      onChange={handleInputChange}
      maxLength={250}
      required
    />
    <button
      type="button"
      onClick={async () => {
        try {
          const response = await axios.post('/api/ai/generate-bio', {
            existingText: formData.bio
          });
          setFormData(prev => ({
            ...prev,
            bio: response.data.text
          }));
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to generate bio');
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
          <span>AI Generate</span>
        </>
      )}
    </button>
  </div>
  <span className="text-sm text-gray-400">
    {bioCount}/250
  </span>
</div>


                <div className="form-group space-y-1 mb-4">
                  <label className="label">Instagram Handle</label>
                  <input
                    type="text"
                    name="instagramHandle"
                    className="input"
                    placeholder="Enter Instagram handle (optional)"
                    value={formData.instagramHandle}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group space-y-1">
                  <label className="label">Featured Image</label>
                  <input
                    type="file"
                    name="featuredImage"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="input"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting || success}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || success}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="spinner-sm" />
                  <span>Creating...</span>
                </div>
              ) : 'Create Portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPortfolioModal;
