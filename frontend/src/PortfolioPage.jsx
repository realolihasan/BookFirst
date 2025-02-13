import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './AuthContext';
import EditPortfolioModal from './EditPortfolioModal';
import BookingModal from './BookingModal';
import { scrollToContact } from './Home';

import { 
  ArrowLeftIcon, 
  TrashIcon, 
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon 
} from '@heroicons/react/24/outline';

axios.defaults.withCredentials = true;

const GalleryMedia = ({ src, alt, index, onClick, onDelete, user }) => {
  const [isHorizontal, setIsHorizontal] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setIsHorizontal(img.width / img.height > 1.2);
    img.src = src;
  }, [src]);

  return (
    <div className={`relative group overflow-hidden rounded-lg ${
      isHorizontal 
        ? 'col-span-3 h-[800px]' // 3 columns for horizontal
        : 'col-span-1 h-[600px]'  // 1 column for vertical
    }`}>
      <img 
        src={src}
        alt={alt}
        className="w-full h-full object-cover cursor-pointer rounded-lg hover:opacity-90 transition-opacity"
        onClick={onClick}
      />
      
      {(user?.role === 'admin' || user?.role === 'co_admin') && (
                <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(index);
          }}
          className="absolute top-2 right-2 p-2 rounded-full bg-black/60 opacity-0 
                    group-hover:opacity-100 transition-opacity hover:bg-black/80"
        >
          <TrashIcon className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
};

const PortfolioPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [portfolio, setPortfolio] = useState(null);
  const [fullScreenMedia, setFullScreenMedia] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/portfolios/${id}`);
        setPortfolio(response.data.data);
        setError(null);
      } catch (err) {
        setError('Failed to load portfolio');
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this portfolio?')) return;

    setIsDeleting(true);
    try {
      await axios.delete(`/api/portfolios/${id}`);
      navigate('/', { replace: true });
    } catch (err) {
      setError('Failed to delete portfolio');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentImagesCount = portfolio?.galleryMedia?.length || 0;
    if (currentImagesCount + files.length > 25) {
      setUploadError('Gallery cannot exceed 25 files');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('galleryMedia', file);
      });

      const response = await axios.post(`/api/portfolios/${id}/gallery`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setPortfolio(response.data.data);
      setUploadError(null);
    } catch (err) {
      setUploadError('Failed to upload files');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageDelete = async (index) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await axios.delete(`/api/portfolios/${id}/gallery/${index}`);
      setPortfolio(response.data.data);
    } catch (err) {
      setError('Failed to delete image');
    }
  };

  if (isLoading) {
    return (
      <div className="page-container flex-center">
        <div className="spinner-lg" />
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="page-container flex-center">
        <div className="alert-error">
          {error || 'Portfolio not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container bg-[#0A0D14]">
      <div className="container mx-auto px-4">
        {/* Navigation Bar */}
        <div className="margin-stack flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Home
          </button>

          {(user?.role === 'admin' || user?.role === 'co_admin') && (
  <div className="action-group">
    <button 
      onClick={() => setIsEditModalOpen(true)} 
      className="btn-secondary"
    >
      Edit Portfolio
    </button>
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="btn-danger"
    >
      {isDeleting ? 'Deleting...' : 'Delete Portfolio'}
    </button>
  </div>
)}
        </div>

        {/* Main Content */}
        <section className="grid md:grid-cols-2 gap-1 card bg-gray-900/50 mb-10">
          {/* Featured Image */}
          <div className="h-[700px] overflow-hidden">
            <img
              src={`/api/portfolios/${id}/featured-image`}
              alt={portfolio.modelName}
              className="w-full h-full object-cover object-center"
              onError={(e) => e.target.src = '/fallback-model.jpg'}
            />
          </div>

          {/* Details */}
          <div className="padding-container flex flex-col justify-center h-full">
            <div className="space-md">
              <h1 className="h1">{portfolio.modelName}</h1>
              
              <div className="bg-gray-800/50 padding-container space-md rounded-lg">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <p className="body"><strong>Height:</strong> {portfolio.height} cm</p>
                  <p className="body"><strong>Weight:</strong> {portfolio.weight} kg</p>
                  <p className="body"><strong>Chest:</strong> {portfolio.chest} cm</p>
                  <p className="body"><strong>Waist:</strong> {portfolio.waist} cm</p>
                </div>

                <div className="space-sm">
                  <p className="body"><strong>Expertise:</strong> {portfolio.expertise}</p>
                  <p className="body">{portfolio.bio}</p>
                </div>
              </div>

  {/* Actions */}
<div className="action-group mt-8 space-x-2">
 <button
   onClick={() => setIsBookingModalOpen(true)}
   className="btn btn-primary"
 >
   Book Now
 </button>
 {portfolio.instagramHandle && (
   <button 
     onClick={() => window.open(`https://www.instagram.com/${portfolio.instagramHandle}`, '_blank')}
     className="btn btn-secondary"
   >
     Instagram
   </button>
 )}
 <button
   onClick={() => {
     navigate('/');
     setTimeout(() => {
       scrollToContact();
     }, 500);
   }}
   className="btn btn-secondary"
 >
   Contact
 </button>
</div>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="section card bg-gray-900/50">
          <div className="margin-stack flex justify-between items-center padding-container">
            <h2 className="h2">Gallery</h2>
            {(user?.role === 'admin' || user?.role === 'co_admin') && (
  <div>
    <input
      ref={fileInputRef}
      id="mediaUpload"
      type="file"
      multiple
      accept="image/*"
      className="hidden"
      onChange={handleImageUpload}
      aria-label="Upload media files"
    />
    <button 
      onClick={() => fileInputRef.current?.click()}
      className="btn-secondary"
      disabled={(portfolio.galleryMedia?.length || 0) >= 25}
    >
      Add Media ({portfolio.galleryMedia?.length || 0}/25)
    </button>
  </div>
)}
          </div>

          {isUploading && (
            <div className="flex-center my-4">
              <div className="spinner-md" />
            </div>
          )}

          {uploadError && (
            <div className="alert-error mx-4 mb-4">{uploadError}</div>
          )}

          <div className="grid grid-cols-3 gap-4 padding-container">
            {portfolio.galleryMedia?.map((media, index) => (
              <GalleryMedia
                key={index}
                src={`/api/portfolios/${id}/gallery/${index}`}
                alt={`Gallery ${index + 1}`}
                index={index}
                onClick={() => setFullScreenMedia({ 
                  currentIndex: index, 
                  items: portfolio.galleryMedia 
                })}
                onDelete={handleImageDelete}
                user={user}
              />
            ))}
          </div>
        </section>

        {/* Fullscreen Gallery View */}
        {fullScreenMedia && (
          <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white"
              onClick={() => setFullScreenMedia(null)}
            >
              <XMarkIcon className="w-12 h-12" />
            </button>
            
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
              onClick={() => {
                const newIndex = (fullScreenMedia.currentIndex - 1 + portfolio.galleryMedia.length) % portfolio.galleryMedia.length;
                setFullScreenMedia({
                  currentIndex: newIndex,
                  items: portfolio.galleryMedia
                });
              }}
            >
              <ChevronLeftIcon className="w-12 h-16" />
            </button>

            <img 
              src={`/api/portfolios/${id}/gallery/${fullScreenMedia.currentIndex}`}
              alt="Fullscreen view"
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />

            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
              onClick={() => {
                const newIndex = (fullScreenMedia.currentIndex + 1) % portfolio.galleryMedia.length;
                setFullScreenMedia({
                  currentIndex: newIndex,
                  items: portfolio.galleryMedia
                });
              }}
            >
              <ChevronRightIcon className="w-12 h-12" />
            </button>
          </div>
        )}

        {/* Modals */}
        {isEditModalOpen && (
          <EditPortfolioModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            portfolio={portfolio}
            onUpdate={setPortfolio}
          />
        )}

        {isBookingModalOpen && (
          <BookingModal
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
            portfolios={[portfolio]}
          />
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;