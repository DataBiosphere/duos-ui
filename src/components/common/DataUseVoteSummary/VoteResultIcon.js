import {CheckCircle, Cancel, Autorenew, RemoveCircle} from '@material-ui/icons';
import {h, div} from 'react-hyperscript-helpers';

const iconFontStyle = {
  fontSize: '3.5rem',
  flex: 1,
};
const iconContainerStyle = {
  display: 'flex',
};

//Possible icons should be Yes, No, Mixed, and Under Review
export default function VoteResultIcon({result, propKey}) {
  const templates = {
    true: [
      h(CheckCircle, {
        className: `vote-result-yes-icon-${propKey}`,
        style: Object.assign({color: '#1FA371'}, iconFontStyle),
      })
    ],
    false: [
      h(Cancel, {
        className: `vote-result-no-icon-${propKey}`,
        style: Object.assign({color: '#DA0003'}, iconFontStyle),
      })
    ],
    underReview: [
      h(Autorenew, {
        className: `vote-result-under-review-icon-${propKey}`,
        style: Object.assign({color: '#A3ADBF'}, iconFontStyle),
      })
    ],
    mixed: [
      h(RemoveCircle, {
        className: `vote-result-mixed-icon-${propKey}`,
        style: Object.assign({color: '#A3ADBF'}, iconFontStyle),
        'data-tip':
          'Mixed outcome stems from varying election results within this Data Use categorization.',
      })
    ]
  };
  return div(
    {
      key: `vote-result-box-${propKey}`,
      className: `vote-result-box-${propKey}`,
      style: iconContainerStyle
    },
    templates[result]
  );
}
