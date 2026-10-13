import React, { useState } from 'react'
import { Alert, Button, Chip, Divider, Rating, Stack, TextField, Typography } from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MAX_COMMENT_LENGTH, StudyComments } from 'src/libs/ajax/StudyComments'
import { Storage } from 'src/libs/storage'
import { studyCommentsQueryKey, useStudyComments } from 'src/hooks/useStudyDetailsData'
import { hasActiveResearcherStatus } from 'src/hooks/useApplyForAccessEligibility'
import StudyQueryResult from './StudyQueryResult'

/**
 * Why the composer is closed to this reader. Both requirements are named only when both are
 * missing: naming the card alone would tell a chairperson or signing official who already holds
 * one that they lack a status they have.
 */
const commentGateReason = (hasResearcherRole: boolean, hasCard: boolean): string => {
  if (hasCard) {
    return 'Commenting on and rating a study is limited to users with the Researcher role.'
  }
  if (hasResearcherRole) {
    return 'Active Researcher Status is required to comment or rate this study.'
  }
  return 'Commenting on and rating a study requires the Researcher role and Active Researcher Status.'
}

const StudyCommentsSection = ({ studyId }: { studyId: string }) => {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState<number | null>(null)
  const [commentText, setCommentText] = useState('')
  // Which user the composer was seeded for, or null when it has not been seeded yet. Keyed to
  // the user rather than a bare boolean: a cross-tab account switch clears the query cache while
  // this component stays mounted, and a boolean latch would leave the previous user's rating and
  // text in the composer for the new one to submit.
  const [seededFor, setSeededFor] = useState<{ userId: number | null } | null>(null)
  const { data, isPending, error, hasNextPage, fetchNextPage, isFetching }
    = useStudyComments(studyId)
  // Every page repeats the study-wide figures, so the first page is where they are read from.
  const summary = data?.pages[0]
  // Offset pagination can repeat a boundary item if another reader posts while pages are being
  // loaded. Keep one copy on screen even if the list changes during the requests.
  const comments = Array.from(new Map(
    (data?.pages.flatMap(page => page.comments) ?? [])
      .map(comment => [comment.studyCommentId, comment]),
  ).values())
  const currentUser = Storage.getCurrentUser()
  // A person holds one rating per study — study_comment is unique on (study_id, user_id) and the
  // DAO upserts — so posting again revises this comment rather than adding a second one. The
  // composer has to say so, or a revision reads as a lost comment and an unexplained average.
  // Read from the payload, not from the page: paging would otherwise hide it on a later page and
  // the composer would offer to add a comment this user already has.
  const ownComment = summary?.yourComment
  const mutation = useMutation({
    mutationFn: () => StudyComments.postComment(studyId, rating ?? 0, commentText),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: studyCommentsQueryKey(studyId) })
      // Re-seed from what was saved rather than blanking the form. The await resolves once the
      // refetch has landed, so the composer comes back showing the comment as it now stands.
      setSeededFor(null)
    },
  })
  // Adjusting state during render behind a latch, as StudyDetails does for its dataset
  // selection: React re-runs the component before it commits, so the form never paints empty
  // and then fills itself in, and a background refetch can't overwrite what the user has typed.
  const currentUserId = currentUser?.userId ?? null
  if (summary && seededFor?.userId !== currentUserId) {
    setSeededFor({ userId: currentUserId })
    setRating(ownComment?.rating ?? null)
    setCommentText(ownComment?.commentText ?? '')
  }
  // Match StudyCommentService's post-time authorization. The role and current library card are
  // independent requirements, so the composer is only useful when both are present.
  const hasResearcherRole = currentUser?.isResearcher === true
  const hasCard = hasActiveResearcherStatus()
  const canComment = hasResearcherRole && hasCard
  const cannotCommentReason = commentGateReason(hasResearcherRole, hasCard)
  // Just the next page. This used to refetch every loaded page first to keep the offsets aligned,
  // but that cost a request per loaded page on every click: walking a 200-comment study ran ~44
  // GETs instead of 8, each one another chance to fail.
  //
  // What that bought, and what it costs to drop it. Comments are newest-first over an offset, so
  // a comment posted while the reader is paging shifts the window down and repeats a boundary
  // item - which the id-keyed dedupe above absorbs. A comment deleted mid-paging shifts it the
  // other way, and one comment slips past the next offset unseen until something refetches.
  // Paging still terminates, since the distinct count stops short of `total` and the walk ends on
  // the first empty page, and any invalidation restores the full list. A stable cursor on the
  // endpoint is the real fix; realigning the entire prefix on every click was an expensive way to
  // buy it, and it never covered a deletion in the page being fetched either.
  const showMoreComments = () => fetchNextPage()

  return (
    // No `isEmpty`: a study with no comments yet is exactly when the composer matters most,
    // so only loading and failure short-circuit the section.
    <StudyQueryResult
      isPending={isPending}
      // Only when there is nothing to show. Gating on `error` alone meant a failed *background*
      // refetch - the one after a successful post, say - replaced the loaded comments and the
      // composer with an error, taking the reader's unsaved draft with it. With no retry on
      // focus and a five-minute staleTime, it stayed that way.
      error={summary ? undefined : error}
      errorMessage="Unable to load comments and ratings."
    >
      <Stack spacing={2}>
        {summary && error && (
          <Alert severity="warning" role="status">
            Couldn't refresh comments just now. Showing the ones already loaded.
          </Alert>
        )}
        {summary?.averageRating != null && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Rating readOnly value={summary.averageRating} precision={0.1} />
            <Typography>
              {summary.averageRating.toFixed(1)}
              {summary.total > 0 && ` (${summary.total})`}
            </Typography>
          </Stack>
        )}
        {comments.map(comment => (
          <div key={comment.studyCommentId}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 600 }}>
                  {comment.displayName}{comment.institutionName ? ` · ${comment.institutionName}` : ''}
                </Typography>
                {comment.studyCommentId === ownComment?.studyCommentId && (
                  <Chip label="Your comment" size="small" />
                )}
              </Stack>
              <Rating size="small" readOnly value={comment.rating} />
            </Stack>
            {comment.commentText && <Typography>{comment.commentText}</Typography>}
            <Divider sx={{ mt: 2 }} />
          </div>
        ))}
        {hasNextPage && (
          <Button
            sx={{ alignSelf: 'flex-start' }}
            disabled={isFetching}
            onClick={showMoreComments}
          >
            {isFetching
              ? 'Loading…'
              : `Show more comments (${comments.length} of ${summary?.total})`}
          </Button>
        )}
        {canComment
          ? (
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {ownComment ? 'Edit your comment' : 'Add your comment'}
                </Typography>
                {ownComment && (
                  <Typography variant="body2" color="text.secondary">
                    You've already rated this study. You can leave one comment per study, so saving
                    replaces your existing rating and comment.
                  </Typography>
                )}
                {/* Frozen while the post is in flight: onSuccess re-seeds both fields from the
                    saved copy, so anything typed meanwhile was discarded without a word. */}
                <Rating value={rating} disabled={mutation.isPending} onChange={(_, value) => setRating(value)} />
                <TextField
                  multiline
                  minRows={3}
                  label="Comment"
                  disabled={mutation.isPending}
                  value={commentText}
                  // The backend rejects anything longer, so stop it at the field rather than
                  // letting the save fail on something the reader cannot see is too long.
                  slotProps={{ htmlInput: { maxLength: MAX_COMMENT_LENGTH } }}
                  helperText={`${commentText.length} / ${MAX_COMMENT_LENGTH}`}
                  onChange={event => setCommentText(event.target.value)}
                />
                <Alert severity="info" role="status">
                  Your name and institution will be shared publicly with this comment.
                </Alert>
                {mutation.isError && (
                  <Alert severity="error">
                    Unable to {ownComment ? 'save your changes' : 'post your comment'}.
                  </Alert>
                )}
                <Button
                  variant="contained"
                  sx={{ alignSelf: 'flex-start' }}
                  disabled={!rating || mutation.isPending}
                  onClick={() => mutation.mutate()}
                >
                  {ownComment ? 'Save changes' : 'Post comment'}
                </Button>
              </Stack>
            )
          : (
              <Alert severity="info" role="status">
                {cannotCommentReason}
              </Alert>
            )}
      </Stack>
    </StudyQueryResult>
  )
}

export default StudyCommentsSection
