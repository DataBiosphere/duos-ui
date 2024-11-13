import React from 'react';
import './Alert.css';
import CloseIcon from '@mui/icons-material/Close';

export interface AlertProps {
  id: string;
  type: string;
  title: string;
  description: string;
  onClose?: () => void;
}

export const Alert = (props: AlertProps) => {
  const {id, type, title, description, onClose} = props;
  return (
    <div id={`${id}_alert`} className={`alert-wrapper ${type}`} style={{border: '1px solid red', borderRadius: '5px'}}>
      {onClose && <span
        style={{float: 'right', fontWeight: 'bolder', fontSize: 24, cursor: 'pointer'}}
        onClick={onClose} ><CloseIcon/></span> }
      {title && <h4 id={`${id}_title`} className="alert-title">{title}</h4>}
      {description && <span id={`${id}_description`} className="alert-description">{description}</span>}
    </div>
  );
};
