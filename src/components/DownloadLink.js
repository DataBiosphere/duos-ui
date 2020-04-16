import _ from 'lodash';
import { div, a, i } from 'react-hyperscript-helpers';
import { Theme } from '../libs/theme';

const ROOT = {
  margin: '8px 0px'
};

const ICON = {
  color: Theme.palette.link,
  marginRight: '6px',
};

export const DownloadLink = props => {
  const { label, onDownload } = props;
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
};
