import React, { useMemo, useState } from 'react'
import { isEmpty, isNil } from 'src/utils/NodashUtil'
import CollectionVoteYesButton from './CollectionVoteYesButton'
import CollectionVoteNoButton from './CollectionVoteNoButton'
import './CollectionSubmitVoteBox.css'
import { Notifications } from 'src/libs/utils'
import { Votes } from 'src/libs/ajax/Votes'
import radarIcon from 'src/images/google-svg/radar.svg'
import { extractConsentError } from 'src/utils/ErrorUtils'
import { Vote } from 'src/types/model'
import { VOTE_TYPES } from 'src/utils/DarUtils'

interface CollectionSubmitVoteBoxProps {
  question?: string
  votes: Vote[]
  isFinal: boolean
  isApprovalDisabled?: boolean
  isLoading: boolean
  isDisabled: boolean
  adminPage: boolean
  bucketKey: string
  updateFinalVote: (bucketKey: string, voteData: { vote: boolean, rationale: string }, voteIds: number[]) => void
  reloadFn?: () => void
  roleLabel?: string
}

interface VoteSubsectionHeadingProps {
  vote: boolean | undefined
  adminPage?: boolean
  isVotingDisabled: boolean
  isRadar: boolean
}

const styles: Record<string, React.CSSProperties> = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontWeight: 'bold',
    color: '#333F52',
    display: 'flex',
    flexDirection: 'column',
    rowGap: '0.5rem',
  },
  question: {
    fontSize: 14,
    fontWeight: 700,
    color: '#333F52',
  },
  subsection: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '0.3rem',
  },
  voteButtons: {
    display: 'flex',
    columnGap: '0.7rem',
  },
  rationaleTextArea: {
    borderRadius: '4px',
    fontWeight: '500',
    color: '#181818A6',
    fontSize: '1.2rem',
    width: '100%',
    maxWidth: '32rem',
  },
  rationaleTitle: {
    fontWeight: 'bold',
    fontSize: '1.2rem',
  },
  chairVoteCaveat: {
    fontStyle: 'italic',
    fontWeight: 400,
    color: '#8a8a8a',
    fontSize: '1.1rem',
  },
}

const VoteSubsectionHeading: React.FC<VoteSubsectionHeadingProps> = ({
  vote,
  adminPage,
  isVotingDisabled,
  isRadar,
}) => {
  let voteResultText
  if (isNil(vote)) {
    voteResultText = 'NOT SELECTED'
  }
  else {
    voteResultText = vote ? 'YES' : 'NO'
  }

  let heading: string | undefined
  if (adminPage) {
    heading = isNil(vote)
      ? 'The vote has not been finalized'
      : `The final vote is: ${voteResultText}`
  }
  else if (isVotingDisabled) {
    heading = voteResultText
  }

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
    </div>
  )
}

const allMatch = (values: (boolean | string | null | undefined)[]) => {
  return values.every((v) => {
    return !isNil(v) && v === values[0]
  })
}

const matchedVote = (votes: Vote[]): boolean | undefined =>
  !isEmpty(votes) && allMatch(votes.map(v => v.vote)) ? (votes[0].vote ?? undefined) : undefined

const votesSubmitted = (votes: Vote[]): boolean =>
  !isEmpty(votes) && allMatch(votes.map(v => v.vote))

const matchedRationale = (votes: Vote[]): string =>
  !isEmpty(votes) && allMatch(votes.map(v => v.rationale)) ? (votes[0].rationale ?? '') : ''

const CollectionSubmitVoteBox: React.FC<CollectionSubmitVoteBoxProps> = (props) => {
  const {
    question,
    votes,
    isFinal,
    isApprovalDisabled,
    isLoading,
    adminPage,
    bucketKey,
    updateFinalVote,
    reloadFn = () => {},
    roleLabel,
  } = props

  const [vote, setVote] = useState<boolean | undefined>(() => matchedVote(votes))
  const [rationale, setRationale] = useState<string>(() => matchedRationale(votes))
  const [submitted, setSubmitted] = useState<boolean>(() => votesSubmitted(votes))
  const [voteInProgress, setVoteInProgress] = useState<boolean>(false)

  const isRadar = !isEmpty(votes) && votes.some(v => v.type === VOTE_TYPES.RADAR_APPROVE)

  const [prevVotes, setPrevVotes] = useState(votes)
  if (votes !== prevVotes) {
    setPrevVotes(votes)
    if (!isEmpty(votes)) {
      if (allMatch(votes.map(v => v.vote))) {
        setVote(votes[0].vote ?? undefined)
        setSubmitted(true)
      }
      if (allMatch(votes.map(v => v.rationale))) {
        setRationale(votes[0].rationale ?? '')
      }
    }
  }

  const isElectionClosed = useMemo(() => {
    return votes.filter(v => v.electionStatus?.toLowerCase() === 'open').length === 0
  }, [votes])

  const isVotingDisabled = useMemo(() => {
    return props.isDisabled || (isFinal && submitted) || adminPage
  }, [props.isDisabled, isFinal, submitted, adminPage])

  const votableChairView = !adminPage && !isVotingDisabled && isFinal

  const updateVote = async (newVote: boolean, isChair: boolean) => {
    setVoteInProgress(true)
    const openElectionVotes = votes.filter(v => v.electionStatus?.toLowerCase() === 'open')
    const voteIds = openElectionVotes.map(v => v.voteId)
    await Votes.updateVotesByIds(voteIds, { vote: newVote, rationale })
    setSubmitted(true)
    // call updateFinalVote for chairs in order to update source collection's votes and trigger sub-component re-render
    if (isChair && updateFinalVote && bucketKey) {
      updateFinalVote(bucketKey, { vote: newVote, rationale }, voteIds)
    }
    setVote(newVote)
    Notifications.showSuccess({ text: 'Successfully updated vote' })
    reloadFn()
    setVoteInProgress(false)
  }

  const onVoteError = (error: unknown, isChair: boolean) => {
    setVoteInProgress(false)
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
      style={styles.baseStyle}
      data-cy="collection-vote-box"
    >
      {question && <div style={styles.question}>{question}</div>}
      <VoteSubsectionHeading
        vote={vote}
        adminPage={adminPage}
        isVotingDisabled={isVotingDisabled}
        isRadar={isRadar}
      />
      <div style={styles.subsection}>
        <span style={styles.rationaleTitle}>Rationale (optional):</span>
        <textarea
          name="Rationale Input"
          value={rationale}
          placeholder={isVotingDisabled ? '' : 'Optional: Enter your comments and describe your rationale prior to voting.'}
          onChange={e => setRationale(e.target.value)}
          onBlur={updateRationale}
          style={styles.rationaleTextArea}
          rows={3}
          disabled={isVotingDisabled || isLoading}
        />
      </div>
      <div className="vote-buttons" style={styles.voteButtons}>
        {!isVotingDisabled && (
          <CollectionVoteYesButton
            onClick={async () => await updateVote(true, !!updateFinalVote)}
            onError={(error: unknown) => onVoteError(error, !!updateFinalVote)}
            disabled={voteInProgress || isVotingDisabled || isApprovalDisabled || isLoading || isElectionClosed}
            isSelected={vote === true}
            roleLabel={roleLabel}
          />
        )}
        {!isVotingDisabled && (
          <CollectionVoteNoButton
            onClick={async () => await updateVote(false, !!updateFinalVote)}
            onError={(error: unknown) => onVoteError(error, !!updateFinalVote)}
            disabled={voteInProgress || isLoading || isVotingDisabled || isElectionClosed}
            isSelected={vote === false}
            roleLabel={roleLabel}
          />
        )}
      </div>
      {votableChairView && (
        <div style={styles.chairVoteCaveat} data-cy="chair-vote-caveat">
          (Vote and Rationale cannot be updated after submitting)
        </div>
      )}
    </div>
  )
}

export default CollectionSubmitVoteBox
