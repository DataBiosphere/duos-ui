import { React, useEffect, useState } from 'react'
import { isEmpty, isNil } from 'lodash/fp'
import CollectionVoteYesButton from './CollectionVoteYesButton'
import CollectionVoteNoButton from './CollectionVoteNoButton'
import { Notifications } from 'src/libs/utils'
import { Votes } from 'src/libs/ajax/Votes'
import radarIcon from 'src/images/google-svg/radar.svg'
import PropTypes from 'prop-types'

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontWeight: 'bold',
    color: '#333F52',
    display: 'flex',
    flexDirection: 'column',
    rowGap: '2rem',
    marginTop: '-20px',
  },
  question: {
    marginTop: '18px',
    fontSize: 17,
    color: '#333F52',
  },
  content: {
    display: 'flex',
    justifyContent: 'flex-start',
    columnGap: '5rem',
    padding: '0 15px',
  },
  subsection: {
    display: 'flex',
  },
  voteButtons: {
    display: 'flex',
    columnGap: '1rem',
  },
  rationaleTextArea: {
    borderRadius: '4px',
    fontWeight: '500',
    color: '#181818A6',
    width: '45rem',
  },
}

const VoteSubsectionHeading = ({ vote, adminPage, isFinal, isVotingDisabled, isRadar }) => {
  const voteResultText = isNil(vote)
    ? 'NOT SELECTED'
    : vote
      ? 'YES'
      : 'NO'

  let heading
  if (adminPage) {
    // read-only admin view; display statement describing the final vote
    heading = isNil(vote)
      ? 'The vote has not been finalized'
      : `The final vote is: ${voteResultText}`
  }
  else if (isVotingDisabled) {
    // if read-only, describe the vote
    heading = voteResultText
  }

  // determines if text is needed to remind the user that their vote will be final once submitting
  const votableChairView = !adminPage && !isVotingDisabled && isFinal

  const radarSpan = isRadar
    ? (
        <img
          data-cy="radar-icon"
          className="radar-icon"
          src={radarIcon}
          alt="Rule Automated Data Access Decision"
          title="Rule Automated Data Access Decision"
        />
      )
    : null

  return (
    <div data-cy="vote-subsection-heading">
      {radarSpan}
      {heading}
      {votableChairView
        && <span style={{ fontWeight: 'normal' }}>(Vote and Rationale cannot be updated after submitting)</span>}
    </div>
  )
}

export default function CollectionSubmitVoteBox(props) {
  const [vote, setVote] = useState()
  const [rationale, setRationale] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isVotingDisabled, setIsVotingDisabled] = useState(false)
  const [isRadar, setIsRadar] = useState(false)
  const {
    question,
    votes,
    isFinal,
    isApprovalDisabled,
    isLoading,
    adminPage,
    bucketKey,
    updateFinalVote,
    reloadFn,
  } = props

  useEffect(() => {
    setIsVotingDisabled(props.isDisabled || (isFinal && submitted) || adminPage)
  }, [props.isDisabled, isFinal, submitted, adminPage])

  useEffect(() => {
    if (!isEmpty(votes)) {
      const prevVote = votes[0]

      const voteValues = votes.map(vote => vote.vote)
      if (allMatch(voteValues)) {
        setVote(prevVote.vote)
        setSubmitted(true)
      }

      const rationaleValues = votes.map(vote => vote.rationale)
      if (allMatch(rationaleValues)) {
        setRationale(prevVote.rationale)
      }

      const isRadar = votes.some(vote => vote.type === 'RADAR_APPROVE')
      setIsRadar(isRadar)
    }
  }, [votes])

  const allMatch = (values) => {
    return values.every((v) => {
      return !isNil(v) && v === values[0]
    })
  }

  const updateVote = async (newVote, isChair) => {
    try {
      const openElectionVotes = votes.filter(v => v.electionStatus.toLowerCase() === 'open')
      const voteIds = openElectionVotes.map(v => v.voteId)
      await Votes.updateVotesByIds(voteIds, { vote: newVote, rationale })
      setSubmitted(true)
      // call updateFinalVote for chairs in order to update source collection's votes and trigger sub-component re-render
      if (isChair) {
        updateFinalVote(bucketKey, { vote: newVote, rationale }, voteIds)
      }
      else {
        setVote(newVote)
      }
      Notifications.showSuccess({ text: 'Successfully updated vote' })
    }
    catch (error) {
      if (error && error.status === 409) {
        const voteText = isChair ? 'Chair vote' : 'Vote'
        Notifications.showError({ text: `${error.response.data.message} ${voteText} not submitted, updating vote display.` })
        reloadFn()
      }
      else {
        Notifications.showError({ text: 'Error: Failed to update vote' })
      }
    }
  }

  const updateRationale = async () => {
    try {
      const voteIds = votes.map(v => v.voteId)
      await Votes.updateRationaleByIds(voteIds, rationale)
      Notifications.showSuccess({ text: 'Successfully updated vote rationale' })
    }
    catch (error) {
      if (error && error.status === 409) {
        Notifications.showError({ text: `${error.response.data.message} Rationale not submitted, updating vote display.` })
        reloadFn()
      }
      else {
        Notifications.showError(
          { text: 'Error: Failed to update vote rationale' })
      }
    }
  }

  return (
    <div
      style={({ marginLeft: '3rem', paddingBottom: '2%', ...styles.baseStyle })}
      data-cy="collection-vote-box"
    >
      <table>
        <thead>
          <tr>
            <th>
              <div style={styles.question}>{question}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div>
                <VoteSubsectionHeading
                  vote={vote}
                  adminPage={adminPage}
                  isFinal={isFinal}
                  isVotingDisabled={isVotingDisabled}
                  isRadar={isRadar}
                />
                <div style={styles.voteButtons}>
                  {!isVotingDisabled && (
                    <CollectionVoteYesButton
                      onClick={() => updateVote(true, !isNil(updateFinalVote))}
                      disabled={isVotingDisabled || isApprovalDisabled || isLoading}
                      isSelected={vote === true}
                    />
                  )}
                  {!isVotingDisabled && (
                    <CollectionVoteNoButton
                      onClick={() => updateVote(false, !isNil(updateFinalVote))}
                      disabled={isLoading || isVotingDisabled}
                      isSelected={vote === false}
                    />
                  )}
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
                  name="Rationale Input"
                  value={rationale}
                  placeholder="Optional: Enter your comments and describe your rationale prior to voting."
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
  )
}

CollectionSubmitVoteBox.propTypes = {
  question: PropTypes.string.isRequired,
  votes: PropTypes.arrayOf(PropTypes.object).isRequired,
  isFinal: PropTypes.bool.isRequired,
  isApprovalDisabled: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isDisabled: PropTypes.bool,
  adminPage: PropTypes.bool,
  bucketKey: PropTypes.string,
  updateFinalVote: PropTypes.func,
  reloadFn: PropTypes.func,
}
