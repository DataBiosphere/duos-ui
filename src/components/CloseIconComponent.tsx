import React from 'react'

interface CloseIconComponentProps {
  closeFn: () => void
  /** Names the control for screen readers, since the glyphicon carries no text. */
  label?: string
}

export default function CloseIconComponent(props: Readonly<CloseIconComponentProps>) {
  const { closeFn, label = 'Close' } = props
  return (
    <button type="button" className="modal-close-btn close" aria-label={label} onClick={closeFn}>
      <span className="glyphicon glyphicon-remove default-color" aria-hidden="true" />
    </button>
  )
}
