import React from 'react';
import _ from 'lodash';
import { div, a, i, hh } from "react-hyperscript-helpers";
import { Theme } from '../libs/theme';

const ROOT = {
  margin: '8px 0px'
};

const ICON = {
  color: Theme.palette.link,
  marginRight: '6px',
};

export const DownloadLink = hh(class DownloadLink extends React.PureComponent {
  render() {
    const { label, onDownload } = this.props;
    return div({ style: ROOT }, [
      a({
        id: _.kebabCase(label),
        onClick: () => onDownload()
      },
        [
          i({ className: 'glyphicon glyphicon-download-alt', style: ICON }),
          label,
        ])
    ]);
  }
});
