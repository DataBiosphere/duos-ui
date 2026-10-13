import React from 'react'

interface CloseIconComponentProps {
  closeFn: () => void
}

export default function CloseIconComponent(props: Readonly<CloseIconComponentProps>) {
  const { closeFn } = props
  return (
    <button type="button" className="modal-close-btn close" aria-label="Close" onClick={closeFn}>
      <span className="glyphicon glyphicon-remove default-color" aria-hidden="true" />
    </button>
  )
}
