import {div} from 'react-hyperscript-helpers';
import * as fp from 'lodash/fp';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import WarningIcon from '@material-ui/icons/Warning';
import InfoIcon from '@material-ui/icons/Info';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ReportIcon from '@material-ui/icons/Report';

export const Notification = (props) => {
  const {banner} = props;
  let bannerDiv = div({style: {display: 'none'}}, []);

  if (!fp.isEmpty(banner)) {
    const iconStyle = {
      marginRight: '2rem',
      verticalAlign: 'middle',
      height: 30,
      width: 30,
    };
    let icon;
    switch (banner.level) {
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
    const content = <ReactMarkdown source={banner.message} linkTarget={'_blank'} className={'underlined'}/>;
    bannerDiv = div({
      style: {padding: '.5rem', paddingTop: '1.5rem'},
      className: 'row no-margin alert alert-' + banner.level,
    }, [
      div({style: {display: 'inline', float: 'left', marginTop: '-.5rem'}}, [icon]),
      div({style: {display: 'inline', paddingTop: '1.5rem'}}, [content]),
    ]);
  }

  return bannerDiv;
};
