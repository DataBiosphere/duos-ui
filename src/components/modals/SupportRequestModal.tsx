import React, { useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  IconButton,
  Chip,
  Paper,
  SelectChangeEvent,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import Dropzone from 'react-dropzone'
import { Link } from 'react-router-dom'
import { Support } from 'src/libs/ajax/Support'
import { Storage } from 'src/libs/storage'
import { Notifications, isEmailAddress } from 'src/libs/utils'
import { handleSignIn } from 'src/libs/signInUtils'
import { AsyncSpinnerMuiButton } from 'src/components/AsyncSpinnerMuiButton'

interface SupportRequestModalProps {
  showModal: boolean
  onCloseRequest: (type: string) => void
  url?: string
}

interface RedirectLinkProps {
  isLogged: boolean
  closeHandler: () => void
}

const RedirectLink: React.FC<RedirectLinkProps> = (props) => {
  const { isLogged, closeHandler } = props
  return (
    <Link
      to={isLogged ? '/datalibrary' : '#'}
      onClick={(e) => {
        if (!isLogged) {
          e.preventDefault()
          handleSignIn('/datalibrary')
        }
        closeHandler()
      }}
      style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 500 }}
    >
      DUOS Data Library
    </Link>
  )
}

interface FormData {
  name: string
  type: string
  subject: string
  description: string
  attachment: File[]
  email: string
}

const resetFormData = (): FormData => {
  const isLogged = Storage.userIsLogged()
  const currentUser = Storage.getCurrentUser()
  return {
    name: isLogged ? currentUser.displayName : '',
    type: 'question',
    subject: '',
    description: '',
    attachment: [],
    email: isLogged ? currentUser.email : '',
  }
}

export const SupportRequestModal: React.FC<SupportRequestModalProps> = (props) => {
  const { showModal, onCloseRequest, url } = props
  const [formData, setFormData] = useState<FormData>(resetFormData)

  const isLogged = Storage.userIsLogged()
  const isEmailValid = isEmailAddress(formData.email)

  const closeHandler = () => {
    setFormData(resetFormData())
    onCloseRequest('support')
  }

  const uploadAttachments = async (files: File[]): Promise<string[]> => {
    const tokens: string[] = []

    for (const file of files) {
      try {
        const response = await Support.uploadAttachment(file)
        if (response.data?.token) {
          tokens.push(response.data.token)
        }
        else {
          throw new Error('No token received')
        }
      }
      catch (error: unknown) {
        const response = error as { status: number, data?: { message?: string } }
        Notifications.showError({
          text: `ERROR ${response.status}: Unable to add attachment: ${response.data?.message}`,
          layout: 'topRight',
        })
        throw error
      }
    }

    return tokens
  }

  const submitHandler = async () => {
    try {
      const attachmentTokens = formData.attachment.length > 0
        ? await uploadAttachments(formData.attachment)
        : []

      const ticket = Support.createTicket(
        formData.name,
        formData.type,
        formData.email,
        formData.subject,
        formData.description,
        attachmentTokens,
        url,
      )

      await Support.createSupportRequest(ticket)
      Notifications.showSuccess({
        text: 'Sent Successfully',
        layout: 'topRight',
        timeout: 1500,
      })
      closeHandler()
    }
    catch (error: unknown) {
      const response = error as { status: number, data?: { message?: string } }
      Notifications.showError({
        text: `ERROR ${response.status}: Unable To Send: ${response.data?.message}`,
        layout: 'topRight',
      })
    }
  }

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const disableSubmitBtn
    = formData.name === ''
      || formData.email === ''
      || formData.subject === ''
      || formData.description === ''
      || !isEmailValid

  return (
    <Dialog
      open={showModal}
      onClose={closeHandler}
      maxWidth="md"
      fullWidth
      data-cy="supportRequestModal"
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="div" fontWeight={600}>
            Contact Us
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={closeHandler}
            aria-label="close"
            data-cy="closeButton"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* FAQ Section */}
        <Box mb={3}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Having issues accessing data you were already approved to use?
            </Typography>
            <Typography variant="body2">
              Please contact the dataset&apos;s Data Custodian listed in the <RedirectLink isLogged={isLogged} closeHandler={closeHandler} />.
            </Typography>
          </Alert>

          <Alert severity="info">
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Want to ask the data access committee(s) about your requests&apos; expected turnaround time?
            </Typography>
            <Typography variant="body2">
              Please contact the dataset&apos;s Data Access Committee (DAC) listed in the <RedirectLink isLogged={isLogged} closeHandler={closeHandler} />.
            </Typography>
          </Alert>
        </Box>

        {/* Form Fields */}
        <Box component="form" noValidate autoComplete="off">
          {!isLogged && (
            <TextField
              fullWidth
              required
              id="txt_name"
              label="Name"
              placeholder="What should we call you?"
              value={formData.name}
              onChange={e => updateField('name', e.target.value)}
              margin="normal"
              data-cy="supportFormName"
            />
          )}

          {!isLogged && (
            <TextField
              fullWidth
              required
              id="txt_email"
              label="Contact Email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={e => updateField('email', e.target.value)}
              error={!isEmailValid && formData.email !== ''}
              helperText={!isEmailValid && formData.email !== '' ? 'Please enter a valid email address' : ''}
              margin="normal"
              data-cy="supportFormEmail"
            />
          )}

          <FormControl fullWidth required margin="normal">
            <InputLabel id="type-label">Type of Support Request</InputLabel>
            <Select
              labelId="type-label"
              id="txt_question"
              value={formData.type}
              label="Type of Support Request"
              onChange={(e: SelectChangeEvent<string>) => updateField('type', e.target.value)}
              data-cy="supportFormType"
            >
              <MenuItem value="question">Question</MenuItem>
              <MenuItem value="bug">Bug</MenuItem>
              <MenuItem value="feature_request">Feature Request</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            required
            id="txt_subject"
            label="Subject"
            placeholder="Enter a subject"
            value={formData.subject}
            onChange={e => updateField('subject', e.target.value)}
            margin="normal"
            data-cy="supportFormSubject"
          />

          <TextField
            fullWidth
            required
            id="txt_description"
            label="Description"
            placeholder="Enter a description"
            value={formData.description}
            onChange={e => updateField('description', e.target.value)}
            multiline
            rows={5}
            margin="normal"
            data-cy="supportFormDescription"
          />

          {/* Attachment Dropzone */}
          <Box mt={2} mb={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Attachment(s)
            </Typography>
            <Dropzone onDrop={files => updateField('attachment', files)}>
              {({ getRootProps, getInputProps, isDragActive }) => {
                const hasAttachments = formData.attachment.length > 0
                return (
                  <Paper
                    {...getRootProps()}
                    variant="outlined"
                    sx={{
                      'p': 3,
                      'textAlign': 'center',
                      'cursor': 'pointer',
                      'backgroundColor': isDragActive ? 'action.hover' : 'background.paper',
                      'borderStyle': 'dashed',
                      'borderWidth': 2,
                      'borderColor': isDragActive ? 'primary.main' : 'divider',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                    data-cy="supportFormAttachmentContainer"
                  >
                    <input {...getInputProps()} data-cy="supportFormAttachment" />
                    {!hasAttachments && (
                      <Box>
                        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          {isDragActive
                            ? 'Drop files here...'
                            : 'Drag and drop files here, or click to select'}
                        </Typography>
                      </Box>
                    )}
                    {hasAttachments && (
                      <Box>
                        <Box display="flex" flexWrap="wrap" gap={1} justifyContent="center" mb={1}>
                          {formData.attachment.map((file, index) => (
                            <Chip
                              key={index}
                              icon={<AttachFileIcon />}
                              label={file.name}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                        <Button
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateField('attachment', [])
                          }}
                        >
                          Remove All
                        </Button>
                      </Box>
                    )}
                  </Paper>
                )
              }}
            </Dropzone>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={closeHandler}
          variant="outlined"
          data-cy="supportFormCancel"
        >
          Cancel
        </Button>
        <AsyncSpinnerMuiButton
          onClick={submitHandler}
          variant="contained"
          disabled={disableSubmitBtn}
          data-cy="supportFormSubmit"
          sx={{ minWidth: 90 }}
        >
          Submit
        </AsyncSpinnerMuiButton>
      </DialogActions>
    </Dialog>
  )
}
