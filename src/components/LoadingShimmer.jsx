import React from 'react';

const LoadingShimmer = ({ style = {}, className = '' }) => (
  <div className={`shimmer-card ${className}`} style={style} aria-hidden="true">
    <div className="shimmer-sheen" />
  </div>
);

export default LoadingShimmer;


