import {React, useEffect, useState} from 'react';
import {isEmpty, isNil, map, every} from 'lodash/fp';
import CollectionVoteYesButton from './CollectionVoteYesButton';
import CollectionVoteNoButton from './CollectionVoteNoButton';
import {Notifications} from '../../libs/utils';
import {Votes} from '../../libs/ajax';

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontWeight: 'bold',
    color: '#333F52',
    display: 'flex',
    flexDirection: 'column',
    rowGap: '2rem',
    marginTop: '-20px'
  },
  question: {
    marginTop: '-18px',
    fontSize: 17,
  },
  content: {
    display: 'flex',
    justifyContent: 'flex-start',
    columnGap: '5rem',
    padding: '0 15px'
  },
  subsection: {
    display: 'flex',
  },
  voteButtons: {
    display: 'flex',
    columnGap: '1rem'
  },
  rationaleTextArea: {
    borderRadius: '4px',
    fontWeight: '500',
    color: '#181818A6',
    width: '45rem',
  }
};

const VoteSubsectionHeading = ({ vote, adminPage, isFinal, isVotingDisabled }) => {
  const voteResultText = isNil(vote) ?
    'NOT SELECTED' :
    vote ?
      'YES' :
      'NO';

  let heading;
  if (adminPage) {
    // read-only admin view; display statement describing the final vote
    heading = isNil(vote) ?
      'The vote has not been finalized' :
      `The final vote is: ${voteResultText}`;
  } else if (isVotingDisabled) {
    // if read-only, describe the vote
    heading = voteResultText;
  }

  // determines if text is needed to remind the user that their vote will be final once submitting
  const votableChairView = !adminPage && !isVotingDisabled && isFinal;

  return (
    <div data-cy={'vote-subsection-heading'}>
      {heading}
      {votableChairView && <span style={{ fontWeight: 'normal' }}>(Vote and Rationale cannot be updated after submitting)</span>}
    </div>
  );
};

export default function CollectionSubmitVoteBox(props) {
  const [vote, setVote] = useState();
  const [rationale, setRationale] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isVotingDisabled, setIsVotingDisabled] = useState(false);
  const {question, votes, isFinal, isApprovalDisabled, isLoading, adminPage, bucketKey, updateFinalVote} = props;

  useEffect(() => {
    setIsVotingDisabled( props.isDisabled || (isFinal && submitted) || adminPage);
  }, [props.isDisabled, isFinal, submitted, adminPage]);

  useEffect(() => {
    if (!isEmpty(votes)) {
      const prevVote = votes[0];

      const voteValues = map(vote => vote.vote)(votes);
      if (allMatch(voteValues)) {
        setVote(prevVote.vote);
        setSubmitted(true);
      }

      const rationaleValues = map( vote => vote.rationale)(votes);
      if (allMatch(rationaleValues)) {
        setRationale(prevVote.rationale);
      }
    }
  }, [votes]);

  const allMatch = (values)  => {
    return every( v => {
      return !isNil(v) && v === values[0];
    })(values);
  };

  const updateVote = async (newVote, isChair) => {
    try {
      const voteIds = map(v => v.voteId)(votes);
      await Votes.updateVotesByIds(voteIds, {vote: newVote, rationale});
      setSubmitted(true);
      //call updateFinalVote for chairs in order to update source collection's votes and trigger sub-component re-render
      isChair ? updateFinalVote(bucketKey, {vote: newVote, rationale}, voteIds) : setVote(newVote);
      Notifications.showSuccess({text: 'Successfully updated vote'});
    } catch (error) {
      Notifications.showError({text: 'Error: Failed to update vote'});
    }
  };

  const updateRationale = async () => {
    try {
      const voteIds = map(v => v.voteId)(votes);
      await Votes.updateRationaleByIds(voteIds, rationale);
      Notifications.showSuccess({text: 'Successfully updated vote rationale'});
    } catch (error) {
      Notifications.showError({text: 'Error: Failed to update vote rationale'});
    }
  };

  return (
    <div
      style={Object.assign({paddingBottom: '2%'}, styles.baseStyle)}
      data-cy={'collection-vote-box'}>
      <table className={'layout-table'} role='presentation'>
        <tbody>
          <tr>
            <td>
              <div style={styles.question}>{question}</div>
            </td>
          </tr>
          <tr>
            <td>
              <div>
                <VoteSubsectionHeading
                  vote={vote}
                  adminPage={adminPage}
                  isFinal={isFinal}
                  isVotingDisabled={isVotingDisabled}
                />
                <div style={styles.voteButtons}>
                  {!isVotingDisabled && <CollectionVoteYesButton
                    onClick={() => updateVote(true, !isNil(updateFinalVote))}
                    disabled={isVotingDisabled || isApprovalDisabled || isLoading}
                    isSelected={vote === true}
                  />}
                  {!isVotingDisabled && <CollectionVoteNoButton
                    onClick={() => updateVote(false, !isNil(updateFinalVote))}
                    disabled={isLoading || isVotingDisabled}
                    isSelected={vote === false}
                  />}
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div style={styles.subsection}>
                <span style={styles.rationaleTitle}>Rationale (optional):</span>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div style={styles.subsection}>
                <textarea
                  name={'Rationale Input'}
                  value={rationale}
                  placeholder={'Optional: Enter your comments and describe your rationale prior to voting.'}
                  onChange={e => setRationale(e.target.value)}
                  onBlur={updateRationale}
                  style={styles.rationaleTextArea}
                  rows={4}
                  disabled={isVotingDisabled || isLoading}
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}