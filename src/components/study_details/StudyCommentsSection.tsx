import React, { useState } from 'react'
import { Alert, Button, Chip, Divider, Rating, Stack, TextField, Typography } from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { StudyComments } from 'src/libs/ajax/StudyComments'
import { Storage } from 'src/libs/storage'
import { studyCommentsQueryKey, useStudyComments } from 'src/hooks/useStudyDetailsData'
import { hasActiveResearcherStatus } from 'src/hooks/useApplyForAccessEligibility'

const StudyCommentsSection = ({ studyId }: { studyId: string }) => {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState<number | null>(null)
  const [commentText, setCommentText] = useState('')
  // Seeded from the user's existing comment once the list arrives; see the latch below.
  const [seeded, setSeeded] = useState(false)
  const { data } = useStudyComments(studyId)
  const currentUser = Storage.getCurrentUser()
  // A person holds one rating per study — study_comment is unique on (study_id, user_id) and the
  // DAO upserts — so posting again revises this comment rather than adding a second one. The
  // composer has to say so, or a revision reads as a lost comment and an unexplained average.
  const ownComment = data?.comments.find(comment => comment.userId === currentUser?.userId)
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
  if (!seeded && data) {
    setSeeded(true)
    setRating(ownComment?.rating ?? null)
    setCommentText(ownComment?.commentText ?? '')
  }
  // Match StudyCommentService's post-time authorization. The role and current library card are
  // independent requirements, so the composer is only useful when both are present.
  const canComment = currentUser?.isResearcher === true && hasActiveResearcherStatus()

  return (
    <Stack spacing={2}>
      {data?.averageRating != null && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Rating readOnly value={data.averageRating} precision={0.1} />
          <Typography>{data.averageRating.toFixed(1)}</Typography>
        </Stack>
      )}
      {(data?.comments ?? []).map(comment => (
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
  )
}

export default StudyCommentsSection
