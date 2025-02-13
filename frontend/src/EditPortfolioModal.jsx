// Path: frontend/src/EditPortfolioModal.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

const EditPortfolioModal = ({ isOpen, onClose, portfolio, onUpdate }) => {
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
    featuredImage: [],
    galleryMedia: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [bioCount, setBioCount] = useState(0);

  useEffect(() => {
    if (portfolio) {
      setFormData({
        modelName: portfolio.modelName || '',
        expertise: portfolio.expertise || '',
        height: portfolio.height || '',
        weight: portfolio.weight || '',
        chest: portfolio.chest || '',
        waist: portfolio.waist || '',
        bio: portfolio.bio || '',
        instagramHandle: portfolio.instagramHandle || ''
      });
      setBioCount(portfolio.bio?.length || 0);
    }
  }, [portfolio]);

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
  
    if (!formData.modelName || !formData.expertise) {
      setError('Please fill all required fields.');
      setIsSubmitting(false);
      return;
    }
  
    const formDataToSend = new FormData();
  
    // Add all form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'instagramHandle' && !value) return;
      if (['height', 'weight', 'chest', 'waist'].includes(key)) {
        formDataToSend.append(key, Number(value));
      } else {
        formDataToSend.append(key, value);
      }
    });
  
    // Add featured image if selected
    if (files.featuredImage[0]) {
      formDataToSend.append('featuredImage', files.featuredImage[0]);
    }
  
    try {
      const response = await axios.put(`/api/portfolios/${portfolio._id}`, formDataToSend, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess(true);
      if (onUpdate) {
        onUpdate(response.data.data);
      }
      
      // After a short delay, check if the featured image was updated.
      // If yes, alert the user that it may take up to 2 hours for the featured image to update.
      // In any case, refresh the page so the latest changes are loaded.
      if (files.featuredImage[0]) {
        setTimeout(() => {
          alert("It will take up to 2 hours for a featured image to update.");
          window.location.reload();
        }, 1500);
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
  
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update portfolio');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal" onClick={(e) => {
      if (e.target.classList.contains('modal')) {
        onClose();
      }
    }}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="h2">Edit Portfolio</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">×</button>
        </div>
  
        {success && (
          <div className="alert-success mb-4">
            Portfolio updated successfully!
          </div>
        )}
  
        {error && <div className="alert-error mb-4">{error}</div>}
  
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information Section */}
            <div className="card bg-gray-800/30">
              <div className="card-body">
                <h3 className="h3 mb-6">Basic Information</h3>
                <div className="space-y-5">
                  <div className="form-group">
                    <label className="label mb-2">Model Name</label>
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
                  <div className="form-group">
                    <label className="label mb-2">Expertise</label>
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
                    <div className="form-group">
                      <label className="label mb-2">Height (cm)</label>
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
                    <div className="form-group">
                      <label className="label mb-2">Weight (kg)</label>
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
                    <div className="form-group">
                      <label className="label mb-2">Chest (cm)</label>
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
                    <div className="form-group">
                      <label className="label mb-2">Waist (cm)</label>
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
            </div>
  
            {/* Details & Media Section */}
            <div className="card bg-gray-800/30">
              <div className="card-body">
                <h3 className="h3 mb-6">Details & Media</h3>
                <div className="space-y-5">
  
                <div className="form-group relative">
  <label className="label mb-2">Bio</label>
  <div className="relative">
    <textarea
      name="bio"
      className="textarea h-[165px]"
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
          setBioCount(response.data.text.length);
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
                  <div className="form-group">
                    <label className="label mb-2">Instagram Handle</label>
                    <input
                      type="text"
                      name="instagramHandle"
                      className="input"
                      placeholder="Enter Instagram handle (optional)"
                      value={formData.instagramHandle}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="label mb-2">
                      Featured Image (Note : Takes 2 Hours to Update)
                    </label>
                    <input
                      type="file"
                      name="featuredImage"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="input"
                    />
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
                <div className="flex-center gap-2">
                  <div className="spinner-sm" />
                  <span>Updating...</span>
                </div>
              ) : 'Update Portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPortfolioModal;