import React from 'react'
import Modal, { Props } from 'react-modal'

export default function ModalWrapper(props: Readonly<Props>): React.ReactElement {
  return <Modal {...props} />
}
