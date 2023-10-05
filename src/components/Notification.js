import {isEmpty} from 'lodash/fp';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReportIcon from '@mui/icons-material/Report';
import style from './Notification.module.css';

export const Notification = (props) => {
  const {notificationData, key} = props;
  let notificationDiv = <div key={key} style={{display: 'none'}}/>;

  if (!isEmpty(notificationData)) {
    const iconStyle = {
      marginRight: '2rem',
      marginLeft: '1rem',
      marginTop: '.5rem',
      height: 30,
      width: 30,
    };
    let icon;
    switch (notificationData.level) {
      case 'success':
        icon = <CheckCircleIcon fill={'#3c763d'} style={iconStyle}/>;
        break;
      case 'info':
        icon = <InfoIcon fill={'#31708f'} style={iconStyle}/>;
        break;
      case 'warning':
        icon = <WarningIcon fill={'#8a6d3b'} style={iconStyle}/>;
        break;
      case 'danger':
        icon = <ReportIcon fill={'#a94442'} style={iconStyle}/>;
        break;
      default:
        icon = <InfoIcon fill={'#3c763d'} style={iconStyle}/>;
        break;
    }
    // eslint-disable-next-line react/no-children-prop
    const content = <ReactMarkdown children={notificationData.message} className={style['underlined']}/>;
    notificationDiv = <div
      key={key}
      className={'row no-margin alert alert-' + notificationData.level}>
      <div style={{float: 'left'}}>{icon}</div>
      <div>{content}</div>
    </div>;
  }

  return notificationDiv;
};
