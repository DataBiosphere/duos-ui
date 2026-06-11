import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { BaseModal } from 'src/components/BaseModal'

vi.mock('react-modal', () => {
  const Modal = ({
    isOpen,
    onAfterOpen,
    children,
  }: {
    isOpen: boolean
    onAfterOpen?: () => void
    onRequestClose?: () => void
    children?: React.ReactNode
  }) => {
    React.useEffect(() => {
      if (isOpen && onAfterOpen) {
        onAfterOpen()
      }
    }, [isOpen, onAfterOpen])

    if (!isOpen) return null
    return <div>{children}</div>
  }
  Modal.setAppElement = () => {}
  return { default: Modal }
})

describe('BaseModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const getDefaultProps = () => ({
    showModal: true,
    onRequestClose: vi.fn(),
    title: 'Test Modal',
    description: 'This is a test modal description',
    color: 'common',
    action: {
      label: 'Confirm',
      handler: vi.fn(),
    },
  })

  it('should render modal when showModal is true', async () => {
    await act(async () => {
      render(<BaseModal {...getDefaultProps()} />)
    })

    expect(document.querySelector('.modal-header')).toBeInTheDocument()
    expect(document.querySelector('.modal-content')).toBeInTheDocument()
    expect(document.querySelector('.modal-footer')).toBeInTheDocument()
  })

  it('should not render modal when showModal is false', async () => {
    await act(async () => {
      render(<BaseModal {...getDefaultProps()} showModal={false} />)
    })

    expect(document.querySelector('.modal-header')).not.toBeInTheDocument()
  })

  it('should display the correct title', async () => {
    await act(async () => {
      render(<BaseModal {...getDefaultProps()} />)
    })

    expect(screen.getByText('Test Modal')).toBeInTheDocument()
  })

  it('should display the correct description', async () => {
    await act(async () => {
      render(<BaseModal {...getDefaultProps()} />)
    })

    expect(screen.getByText('This is a test modal description')).toBeInTheDocument()
  })

  it('should render children content', async () => {
    await act(async () => {
      render(
        <BaseModal {...getDefaultProps()}>
          <div data-testid="test-child">Child Content</div>
        </BaseModal>,
      )
    })

    expect(screen.getByTestId('test-child')).toHaveTextContent('Child Content')
  })

  it('should call onRequestClose when close button is clicked', async () => {
    const props = getDefaultProps()
    await act(async () => {
      render(<BaseModal {...props} />)
    })

    fireEvent.click(document.querySelector('.modal-close-btn')!)
    expect(props.onRequestClose).toHaveBeenCalled()
  })

  it('should call onRequestClose when cancel button is clicked', async () => {
    const props = getDefaultProps()
    await act(async () => {
      render(<BaseModal {...props} />)
    })

    fireEvent.click(document.querySelector('#btn-cancel')!)
    expect(props.onRequestClose).toHaveBeenCalled()
  })

  it('should call action handler when action button is clicked', async () => {
    const props = getDefaultProps()
    await act(async () => {
      render(<BaseModal {...props} />)
    })

    fireEvent.click(document.querySelector('#btn_action')!)
    expect(props.action.handler).toHaveBeenCalled()
  })

  it('should display the correct action button label', async () => {
    await act(async () => {
      render(<BaseModal {...getDefaultProps()} />)
    })

    expect(document.querySelector('#btn_action')).toHaveTextContent('Confirm')
  })

  it('should hide cancel button when type is informative', async () => {
    await act(async () => {
      render(<BaseModal {...getDefaultProps()} type="informative" />)
    })

    expect(document.querySelector('#btn-cancel')).not.toBeInTheDocument()
    expect(document.querySelector('#btn_action')).toBeInTheDocument()
  })

  it('should show cancel button when type is default', async () => {
    await act(async () => {
      render(<BaseModal {...getDefaultProps()} type="default" />)
    })

    expect(document.querySelector('#btn-cancel')).toBeInTheDocument()
    expect(document.querySelector('#btn_action')).toBeInTheDocument()
  })

  it('should show cancel button when type is not specified', async () => {
    await act(async () => {
      render(<BaseModal {...getDefaultProps()} />)
    })

    expect(document.querySelector('#btn-cancel')).toBeInTheDocument()
  })

  it('should disable action button when disableOkBtn is true', async () => {
    await act(async () => {
      render(<BaseModal {...getDefaultProps()} disableOkBtn={true} />)
    })

    expect(document.querySelector('#btn_action')).toBeDisabled()
  })

  it('should enable action button when disableOkBtn is false', async () => {
    await act(async () => {
      render(<BaseModal {...getDefaultProps()} disableOkBtn={false} />)
    })

    expect(document.querySelector('#btn_action')).not.toBeDisabled()
  })

  it('should enable action button by default', async () => {
    await act(async () => {
      render(<BaseModal {...getDefaultProps()} />)
    })

    expect(document.querySelector('#btn_action')).not.toBeDisabled()
  })

  it('should apply the correct color class to action button', async () => {
    await act(async () => {
      render(<BaseModal {...getDefaultProps()} color="cancel" />)
    })

    expect(document.querySelector('#btn_action')).toHaveClass('cancel-background')
  })

  it('should call afterOpen callback when modal opens', async () => {
    const afterOpen = vi.fn()
    await act(async () => {
      render(<BaseModal {...getDefaultProps()} afterOpen={afterOpen} />)
    })

    expect(afterOpen).toHaveBeenCalled()
  })

  it('should render with custom iconSize prop', async () => {
    await act(async () => {
      render(<BaseModal {...getDefaultProps()} iconSize="large" />)
    })

    expect(document.querySelector('.modal-header')).toBeInTheDocument()
  })

  it('should render with id prop', async () => {
    await act(async () => {
      render(<BaseModal {...getDefaultProps()} id="custom-modal-id" />)
    })

    expect(document.querySelector('.modal-header')).toBeInTheDocument()
  })

  it('should render with imgSrc prop', async () => {
    await act(async () => {
      render(<BaseModal {...getDefaultProps()} imgSrc="/test-image.png" />)
    })

    expect(document.querySelector('.modal-header')).toBeInTheDocument()
  })

  it('should have correct button classes', async () => {
    await act(async () => {
      render(<BaseModal {...getDefaultProps()} />)
    })

    const actionBtn = document.querySelector('#btn_action')
    expect(actionBtn).toHaveClass('btn')
    expect(actionBtn).toHaveClass('common-background')

    const cancelBtn = document.querySelector('#btn-cancel')
    expect(cancelBtn).toHaveClass('btn')
    expect(cancelBtn).toHaveClass('dismiss-background')
  })
})
