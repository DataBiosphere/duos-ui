import React from 'react'
import CloseIcon from '@mui/icons-material/Close'
import { inlineIconSx } from 'src/libs/inlineIcon'

interface CloseIconComponentProps {
  closeFn: () => void
}

export default function CloseIconComponent(props: Readonly<CloseIconComponentProps>) {
  const { closeFn } = props
  return (
    <button type="button" className="modal-close-btn close" aria-label="Close" onClick={closeFn}>
      <CloseIcon className="default-color" sx={inlineIconSx} />
    </button>
  )
}
