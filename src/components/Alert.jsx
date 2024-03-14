import React from 'react';
import './Alert.css';

export const Alert = ({ id, type, title, description }) => {
  return (
    <div id={`${id}_alert`} className={`alert-wrapper ${type}`}>
      {title && <h4 id={`${id}_title`} className="alert-title">{title}</h4>}
      {description && <span id={`${id}_description`} className="alert-description">{description}</span>}
    </div>
  );
};
