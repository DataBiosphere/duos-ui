import React from 'react';
import CollectionVoteButton from './CollectionVoteButton';
import { CancelOutlined } from '@mui/icons-material';
import { votingColors } from '../../pages/dar_collection_review/MultiDatasetVotingTab';

export default function CollectionVoteNoButton(props) {
  const { onClick, disabled, isSelected } = props;

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
    return (
      <span style={styles.label}>
        <CancelOutlined style={styles.icon} />
        No
      </span>
    );
  };

  return (
    <CollectionVoteButton
      datacy="no-collection-vote-button"
      label={<Label />}
      onClick={() => onClick()}
      baseColor={votingColors.no}
      disabled={disabled}
      isSelected={isSelected}
    />
  );
}
