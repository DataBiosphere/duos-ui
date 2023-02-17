import {h, span} from 'react-hyperscript-helpers';
import CollectionVoteButton from './CollectionVoteButton';
import {CheckCircleOutlined} from '@mui/icons-material';
import {votingColors} from '../../pages/dar_collection_review/MultiDatasetVotingTab';

export default function CollectionVoteYesButton(props) {
  const {onClick, disabled, isSelected} = props;

  const styles = {
    label: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    icon: {
      fontSize: '28px',
      margin: '2.5%'
    }
  };

  const Label = () => {
    return span({style: styles.label}, [
      h(CheckCircleOutlined, {style: styles.icon}),
      'Yes'
    ]);
  };

  return h(CollectionVoteButton, {
    datacy: 'yes-collection-vote-button',
    label: h(Label),
    onClick: () => onClick(),
    baseColor: votingColors.yes,
    disabled,
    isSelected
  });
}
