import React, { useEffect, useState } from 'react'
import { isEmpty, isNil } from 'lodash/fp'
import CollectionVoteYesButton from './CollectionVoteYesButton'
import CollectionVoteNoButton from './CollectionVoteNoButton'
import { Notifications } from 'src/libs/utils'
import { Votes } from 'src/libs/ajax/Votes'
import radarIcon from 'src/images/google-svg/radar.svg'
import { extractConsentError } from 'src/utils/ErrorUtils'

interface Vote {
  voteId: string
  vote: boolean | null
  rationale: string
  electionStatus: string
  type?: string
}

interface CollectionSubmitVoteBoxProps {
  question?: string
  votes: Vote[]
  isFinal?: boolean
  isApprovalDisabled?: boolean
  isLoading?: boolean
  isDisabled?: boolean
  adminPage?: boolean
  bucketKey?: string
  updateFinalVote?: (bucketKey: string, voteData: { vote: boolean, rationale: string }, voteIds: string[]) => void
  reloadFn?: () => void
}

interface VoteSubsectionHeadingProps {
  vote: boolean | undefined
  adminPage: boolean
  isFinal: boolean
  isVotingDisabled: boolean
  isRadar: boolean
}

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
  rationaleTitle: {
    fontWeight: 'bold',
    marginRight: '1rem',
  },
}

const VoteSubsectionHeading: React.FC<VoteSubsectionHeadingProps> = ({
  vote,
  adminPage,
  isFinal,
  isVotingDisabled,
  isRadar,
}) => {
  const voteResultText = isNil(vote)
    ? 'NOT SELECTED'
    : vote
      ? 'YES'
      : 'NO'

  let heading: string | undefined
  if (adminPage) {
    heading = isNil(vote)
      ? 'The vote has not been finalized'
      : `The final vote is: ${voteResultText}`
  }
  else if (isVotingDisabled) {
    heading = voteResultText
  }

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

const allMatch = (values: (boolean | string | null | undefined)[]) => {
  return values.every((v) => {
    return !isNil(v) && v === values[0]
  })
}

const CollectionSubmitVoteBox: React.FC<CollectionSubmitVoteBoxProps> = (props) => {
  const [vote, setVote] = useState<boolean | undefined>()
  const [rationale, setRationale] = useState<string>('')
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [isVotingDisabled, setIsVotingDisabled] = useState<boolean>(false)
  const [isRadar, setIsRadar] = useState<boolean>(false)
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
    setIsVotingDisabled(props.isDisabled || (isFinal && submitted) || !!adminPage)
  }, [props.isDisabled, isFinal, submitted, adminPage])

  useEffect(() => {
    if (!isEmpty(votes)) {
      const prevVote = votes[0]

      const voteValues = votes.map(vote => vote.vote)
      if (allMatch(voteValues)) {
        setVote(prevVote.vote ?? undefined)
        setSubmitted(true)
      }

      const rationaleValues = votes.map(vote => vote.rationale)
      if (allMatch(rationaleValues)) {
        setRationale(prevVote.rationale)
      }

      const radar = votes.some(vote => vote.type === 'RADAR_APPROVE')
      setIsRadar(radar)
    }
  }, [votes])

  const updateVote = async (newVote: boolean, isChair: boolean) => {
    try {
      const openElectionVotes = votes.filter(v => v.electionStatus.toLowerCase() === 'open')
      const voteIds = openElectionVotes.map(v => v.voteId)
      await Votes.updateVotesByIds(voteIds, { vote: newVote, rationale })
      setSubmitted(true)
      if (isChair && updateFinalVote && bucketKey) {
        updateFinalVote(bucketKey, { vote: newVote, rationale }, voteIds)
      }
      else {
        setVote(newVote)
      }
      Notifications.showSuccess({ text: 'Successfully updated vote' })
    }
    catch (error: unknown) {
      const consentError = extractConsentError(error)
      if (consentError && consentError.code === 409) {
        const voteText = isChair ? 'Chair vote' : 'Vote'
        Notifications.showError({ text: `${consentError.message} ${voteText} not submitted, updating vote display.` })
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
    catch (error: unknown) {
      const consentError = extractConsentError(error)
      if (consentError && consentError.code === 409) {
        Notifications.showError({ text: `${consentError.message} Rationale not submitted, updating vote display.` })
        reloadFn()
      }
      else {
        Notifications.showError({ text: 'Error: Failed to update vote rationale' })
      }
    }
  }

  return (
    <div
      style={{ marginLeft: '3rem', paddingBottom: '2%', ...styles.baseStyle }}
      data-cy="collection-vote-box"
    >
      <table>
        <thead>
          <tr>
            <th>
              {question && <div style={styles.question}>{question}</div>}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div>
                <VoteSubsectionHeading
                  vote={vote}
                  adminPage={!!adminPage}
                  isFinal={!!isFinal}
                  isVotingDisabled={isVotingDisabled}
                  isRadar={isRadar}
                />
                <div style={styles.voteButtons}>
                  {!isVotingDisabled && (
                    <CollectionVoteYesButton
                      onClick={() => updateVote(true, !!updateFinalVote)}
                      disabled={isVotingDisabled || !!isApprovalDisabled || !!isLoading}
                      isSelected={vote === true}
                    />
                  )}
                  {!isVotingDisabled && (
                    <CollectionVoteNoButton
                      onClick={() => updateVote(false, !!updateFinalVote)}
                      disabled={!!isLoading || isVotingDisabled}
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
                  disabled={isVotingDisabled || !!isLoading}
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default CollectionSubmitVoteBox
