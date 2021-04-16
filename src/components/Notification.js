import {div} from 'react-hyperscript-helpers';
import * as fp from 'lodash/fp';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import WarningIcon from '@material-ui/icons/Warning';
import InfoIcon from '@material-ui/icons/Info';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ReportIcon from '@material-ui/icons/Report';

export const Notification = (props) => {
  const {notificationData} = props;
  let notificationDiv = div({style: {display: 'none'}}, []);

  if (!fp.isEmpty(notificationData)) {
    const iconStyle = {
      marginRight: '2rem',
      marginLeft: '1rem',
      marginBottom: '2px',
      height: 30,
      width: 30,
    };
    let icon;
    switch (notificationData.level) {
      case 'success':
        icon = <CheckCircleIcon fill={'#3c763d'} style={ iconStyle } />;
        break;
      case 'info':
        icon = <InfoIcon fill={'#31708f'} style={ iconStyle } />;
        break;
      case 'warning':
        icon = <WarningIcon fill={'#8a6d3b'} style={ iconStyle } />;
        break;
      case 'danger':
        icon = <ReportIcon fill={'#a94442'} style={ iconStyle } />;
        break;
      default:
        icon = <InfoIcon fill={'#3c763d'} style={ iconStyle } />;
        break;
    }
    // eslint-disable-next-line react/no-children-prop
    const content = <ReactMarkdown children={notificationData.message} linkTarget={'_blank'} className={'underlined'}></ReactMarkdown>;
    notificationDiv = div({
      style: {padding: '.5rem', paddingTop: '1.5rem'},
      className: 'row no-margin alert alert-' + notificationData.level,
    }, [
      div({style: {float: 'left'}}, [icon]),
      div({style: {marginTop: '0.5rem'}}, [content]),
    ]);
  }

  return notificationDiv;
};
