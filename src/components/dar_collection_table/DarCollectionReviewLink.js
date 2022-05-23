import { h } from 'react-hyperscript-helpers';
import { NavLink } from 'react-router-dom';
import { styles } from './DarCollectionTable';

export default function DarCollectionReviewLink(props) {
  const { darCollectionId, darCode } = props;
  return h(NavLink, {
    style: {
      fontSize: styles.fontSize.darCode,
      fontFamily: styles.baseStyle.fontFamily,
      fontWeight: 600
    },
    to: `admin_review_collection/${darCollectionId}`,
    id: `collection-review-${darCollectionId}}`
  }, [darCode]);
}