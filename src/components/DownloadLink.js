import _ from 'lodash';
import { div, a, i, span } from 'react-hyperscript-helpers';
import { Theme } from '../libs/theme';

const ICON = {
  color: Theme.palette.link,
  marginRight: '6px',
};

export const DownloadLink = props => {
  const { label, onDownload } = props;
  return div({}, [
    a({
      id: _.kebabCase(label),
      onClick: () => onDownload()
    },
    [
      i({ className: 'glyphicon glyphicon-download-alt', style: ICON }),
      span({style: { fontSize: Theme.font.size.small }}, label)
    ])
  ]);
};
