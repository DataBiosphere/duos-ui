import React, { useState } from 'react'
import { Alert, Button, Chip, Divider, Rating, Stack, TextField, Typography } from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MAX_COMMENT_LENGTH, StudyComments } from 'src/libs/ajax/StudyComments'
import { Storage } from 'src/libs/storage'
import { studyCommentsQueryKey, useStudyComments } from 'src/hooks/useStudyDetailsData'
import { hasActiveResearcherStatus } from 'src/hooks/useApplyForAccessEligibility'
import StudyQueryResult from './StudyQueryResult'

const StudyCommentsSection = ({ studyId }: { studyId: string }) => {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState<number | null>(null)
  const [commentText, setCommentText] = useState('')
  // Seeded from the user's existing comment once the list arrives; see the latch below.
  const [seeded, setSeeded] = useState(false)
  const { data, isPending, error, hasNextPage, fetchNextPage, isFetching, refetch }
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
      setSeeded(false)
    },
  })
  // Adjusting state during render behind a latch, as StudyDetails does for its dataset
  // selection: React re-runs the component before it commits, so the form never paints empty
  // and then fills itself in, and a background refetch can't overwrite what the user has typed.
  if (!seeded && summary) {
    setSeeded(true)
    setRating(ownComment?.rating ?? null)
    setCommentText(ownComment?.commentText ?? '')
  }
  // Match StudyCommentService's post-time authorization. The role and current library card are
  // independent requirements, so the composer is only useful when both are present.
  const canComment = currentUser?.isResearcher === true && hasActiveResearcherStatus()
  const showMoreComments = async () => {
    // Refresh the pages already on screen before calculating the next offset. Since comments are
    // newest-first, this realigns every loaded boundary when a comment was added or removed since
    // the reader opened the section.
    const refreshed = await refetch()
    if (!refreshed.isError) await fetchNextPage()
  }

  return (
    // No `isEmpty`: a study with no comments yet is exactly when the composer matters most,
    // so only loading and failure short-circuit the section.
    <StudyQueryResult
      isPending={isPending}
      error={error}
      errorMessage="Unable to load comments and ratings."
    >
      <Stack spacing={2}>
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
                <Rating value={rating} onChange={(_, value) => setRating(value)} />
                <TextField
                  multiline
                  minRows={3}
                  label="Comment"
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
                Active Researcher Status is required to comment or rate this study.
              </Alert>
            )}
      </Stack>
    </StudyQueryResult>
  )
}

export default StudyCommentsSection
