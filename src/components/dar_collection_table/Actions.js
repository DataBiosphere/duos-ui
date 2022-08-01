import { div, h } from 'react-hyperscript-helpers';
import TableIconButton from '../TableIconButton';
import { Styles } from '../../libs/theme';
import { Block } from '@material-ui/icons';
import SimpleButton from '../SimpleButton';

const duosBlue = '#0948B7';
const cancelGray = '#333F52';

const hoverCancelButtonStyle = Styles.TABLE.TABLE_BUTTON_ICON_HOVER;
const baseCancelButtonStyle = Object.assign(
  {},
  Styles.TABLE.TABLE_ICON_BUTTON,
  {color: cancelGray},
  { alignItems: 'center' }
);

export default function Actions(props) {
  const { showConfirmationModal, collection, goToVote, consoleType, actions = [] } = props;
  const collectionId = collection.darCollectionId;

  const openOnClick = async (collection) => {
    showConfirmationModal(collection, 'open');
  };

  const cancelOnClick = (collection) => {
    showConfirmationModal(collection, 'cancel');
  };

  const openButtonAttributes = {
    keyProp: `${consoleType}-open-${collectionId}`,
    label: 'Open',
    isRendered: actions.includes('Open'),
    onClick: () => openOnClick(collection),
    baseColor: duosBlue,
    hoverStyle: {
      backgroundColor: duosBlue,
      color: 'white'
    },
    additionalStyle: {
      padding: '3% 7%',
      fontSize: '1.45rem',
      fontWeight: 600,
      color: 'white',
      marginRight: '8%'
    }
  };

  const cancelButtonAttributes = {
    keyProp: `${consoleType}-cancel-${collectionId}`,
    isRendered: actions.includes('Cancel'),
    onClick: () => cancelOnClick(collection),
    style: baseCancelButtonStyle,
    hoverStyle: hoverCancelButtonStyle,
    dataTip: 'Cancel Elections',
    icon: Block,
  };

  const voteButtonAttributes = {
    keyProp: `${consoleType}-vote-${collectionId}`,
    label: 'Vote',
    isRendered: actions.includes('Vote'),
    onClick: () => goToVote(collectionId),
    baseColor: duosBlue,
    hoverStyle: {
      backgroundColor: duosBlue,
      color: 'white',
    },
    additionalStyle: {
      padding: '3% 7%',
      fontSize: '1.45rem',
      fontWeight: 600,
      color: 'white',
      marginRight: '8%',
      border: `1px ${duosBlue} solid`,
    },
  };

  const updateButtonAttributes = {
    keyProp: `${consoleType}-update-${collectionId}`,
    label: 'Update',
    isRendered: actions.includes('Update'),
    onClick: () => goToVote(collectionId),
    baseColor: 'white',
    hoverStyle: {
      backgroundColor: 'white',
      color: duosBlue
    },
    additionalStyle: {
      padding: '3% 7%',
      fontSize: '1.45rem',
      fontWeight: 600,
      color: duosBlue,
      marginRight: '8%',
      border: `1px ${duosBlue} solid`
    }
  };

  return div(
    {
      className: `${consoleType}-actions`,
      key: `${consoleType}-actions-${collectionId}`,
      id: `${consoleType}-actions-${collectionId}`,
      style: {
        display: 'flex',
        padding: '10px 5px',
        justifyContent: 'flex-start',
        alignItems: 'center',
      },
    },
    [
      h(SimpleButton, openButtonAttributes),
      h(SimpleButton, voteButtonAttributes),
      h(SimpleButton, updateButtonAttributes),
      h(TableIconButton, cancelButtonAttributes),
    ]
  );
}
