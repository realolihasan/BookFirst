// Path: frontend/src/PortfolioCard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

const PortfolioCard = ({ model }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/portfolio/${model._id}`)}
      className="card card-hover cursor-pointer group"
    >
      <div className="card-image">
        <img 
          src={`/api/portfolios/${model._id}/featured-image`}
          alt={model.modelName}
          className="image-fill group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder.jpg';
          }}
        />
        <div className="overlay-dark">
          <div className="text-white text-center padding-container">
            <p className="h3">{model.expertise}</p>
            <p className="caption mt-2">Click to view details</p>
          </div>
        </div>
      </div>
      
      <div className="card-body">
        <h3 className="card-title">{model.modelName}</h3>
        <div className="flex justify-between items-center mt-2">
          <p className="caption">{model.expertise}</p>
          <div className="flex gap-2">
            <span className="caption">{model.height}cm</span>
            <span className="caption">•</span>
            <span className="caption">{model.weight}kg</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioCard;