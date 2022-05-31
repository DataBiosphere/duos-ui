import {h} from 'react-hyperscript-helpers';
import SimpleButton from '../SimpleButton';
import {Theme} from '../../libs/theme';

export default function ReviseCollectionButton(props) {
  const { collection } = props;
  const collectionId = collection.darCollectionId;
  return h(SimpleButton, {
    keyProp: `revise-collection-${collectionId}`,
    label: 'Revise',
    baseColor: Theme.palette.secondary,
    additionalStyle: {
      padding: '5px 10px',
      fontSize: '1.45rem',
    },
    onClick: () => props.showConfirmationModal(collection, 'revise')
  });
}