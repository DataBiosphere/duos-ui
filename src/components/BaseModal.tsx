import React, { ReactNode } from 'react'
import Modal from 'react-modal'
import 'src/components/BaseModal.css'
import { PageSubHeading } from 'src/components/PageSubHeading'
import CloseIconComponent from 'src/components/CloseIconComponent'

const customStyles = {
  overlay: {
    position: 'fixed' as const,
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    overflowY: 'auto' as const,
  },

  content: {
    position: 'relative' as const,
    top: '20%',
    maxHeight: '60%',
    margin: '0 auto',
    maxWidth: '60%',
    border: '1px solid rgb(204, 204, 204)',
    background: 'rgb(255, 255, 255)',
    overflow: 'auto' as const,
    borderRadius: '4px',
    outline: 'none',
    padding: '10px 20px 20px 20px',
  },
}

Modal.setAppElement('#root')

export interface BaseModalProps {
  showModal: boolean
  onRequestClose: () => void
  afterOpen?: () => void
  id?: string
  imgSrc?: string
  color?: string
  iconSize?: 'none' | 'medium' | 'large'
  title: string
  description?: string
  children?: ReactNode
  action: {
    label: string
    handler: () => void
  }
  type?: 'informative' | 'default'
  disableOkBtn?: boolean
}

export const BaseModal: React.FC<BaseModalProps> = (props) => {
  const { disableOkBtn = false } = props
  return (
    <div>
      <Modal
        isOpen={props.showModal}
        onAfterOpen={props.afterOpen}
        onRequestClose={props.onRequestClose}
        style={customStyles}
        contentLabel="Modal"
      >
        <div className="modal-header">
          <CloseIconComponent
            closeFn={props.onRequestClose}
          />
          <PageSubHeading
            id={props.id}
            imgSrc={props.imgSrc}
            color={props.color}
            iconSize={props.iconSize}
            title={props.title}
            description={props.description}
          />
        </div>
        <div className="modal-content">
          {props.children}
        </div>

        <div className="modal-footer">
          <button
            id="btn_action"
            className={`col-lg-3 col-md-3 col-sm-4 col-xs-6 btn ${props.color}-background`}
            onClick={props.action.handler}
            disabled={disableOkBtn}
          >
            {props.action.label}
          </button>
          {
            props.type !== 'informative' && (
              <button
                id="btn-cancel"
                className="col-lg-3 col-md-3 col-sm-4 col-xs-6 btn dismiss-background"
                onClick={props.onRequestClose}
              >
                Cancel
              </button>
            )
          }
        </div>
      </Modal>
    </div>
  )
}
