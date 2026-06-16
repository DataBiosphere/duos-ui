import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import ModalWrapper from 'src/components/collaborator_list/ModalWrapper'

vi.mock('react-modal', () => {
  const Modal = ({
    isOpen,
    onAfterOpen,
    onRequestClose,
    children,
    className,
    overlayClassName,
    style,
    contentLabel,
  }: {
    isOpen: boolean
    onAfterOpen?: () => void
    onRequestClose?: () => void
    children?: React.ReactNode
    className?: string
    overlayClassName?: string
    style?: { content?: React.CSSProperties, overlay?: React.CSSProperties }
    contentLabel?: string
  }) => {
    React.useEffect(() => {
      if (isOpen && onAfterOpen) {
        onAfterOpen()
      }
    }, [isOpen, onAfterOpen])

    if (!isOpen) return null

    return (
      <div
        className={`ReactModal__Overlay${overlayClassName ? ` ${overlayClassName}` : ''}`}
        onClick={onRequestClose}
      >
        <div
          className={`ReactModal__Content${className ? ` ${className}` : ''}`}
          aria-label={contentLabel}
          style={style?.content}
        >
          {children}
        </div>
      </div>
    )
  }
  Modal.setAppElement = () => {}
  return { default: Modal }
})

describe('ModalWrapper - Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default props', async () => {
    await act(async () => {
      render(
        <ModalWrapper isOpen={true} ariaHideApp={false}>
          <div data-testid="modal-content">Test Content</div>
        </ModalWrapper>,
      )
    })

    expect(document.querySelector('.ReactModal__Content')).toBeInTheDocument()
    expect(screen.getByTestId('modal-content')).toBeVisible()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', async () => {
    await act(async () => {
      render(
        <ModalWrapper isOpen={false} ariaHideApp={false}>
          <div data-testid="modal-content">Test Content</div>
        </ModalWrapper>,
      )
    })

    expect(document.querySelector('.ReactModal__Content')).not.toBeInTheDocument()
  })

  it('applies custom className', async () => {
    await act(async () => {
      render(
        <ModalWrapper isOpen={true} ariaHideApp={false} className="custom-modal-class">
          <div>Test Content</div>
        </ModalWrapper>,
      )
    })

    expect(document.querySelector('.custom-modal-class')).toBeInTheDocument()
  })

  it('applies overlayClassName', async () => {
    await act(async () => {
      render(
        <ModalWrapper isOpen={true} ariaHideApp={false} overlayClassName="custom-overlay-class">
          <div>Test Content</div>
        </ModalWrapper>,
      )
    })

    expect(document.querySelector('.custom-overlay-class')).toBeInTheDocument()
  })

  it('handles onAfterOpen callback', async () => {
    const onAfterOpen = vi.fn()

    await act(async () => {
      render(
        <ModalWrapper isOpen={true} ariaHideApp={false} onAfterOpen={onAfterOpen}>
          <div>Test Content</div>
        </ModalWrapper>,
      )
    })

    expect(onAfterOpen).toHaveBeenCalled()
  })

  it('handles onRequestClose callback when clicking overlay', async () => {
    const onRequestClose = vi.fn()

    await act(async () => {
      render(
        <ModalWrapper
          isOpen={true}
          ariaHideApp={false}
          onRequestClose={onRequestClose}
          shouldCloseOnOverlayClick={true}
        >
          <div data-testid="modal-content">Test Content</div>
        </ModalWrapper>,
      )
    })

    fireEvent.click(document.querySelector('.ReactModal__Overlay')!)
    expect(onRequestClose).toHaveBeenCalled()
  })

  it('supports custom styling', async () => {
    const customStyle = {
      content: {
        backgroundColor: 'rgb(255, 0, 0)',
      },
    }

    await act(async () => {
      render(
        <ModalWrapper isOpen={true} ariaHideApp={false} style={customStyle}>
          <div>Test Content</div>
        </ModalWrapper>,
      )
    })

    const content = document.querySelector('.ReactModal__Content') as HTMLElement
    expect(content).toBeInTheDocument()
    expect(content.style.backgroundColor).toBe('rgb(255, 0, 0)')
  })

  it('renders with custom content label', async () => {
    await act(async () => {
      render(
        <ModalWrapper isOpen={true} ariaHideApp={false} contentLabel="Test Modal Label">
          <div>Test Content</div>
        </ModalWrapper>,
      )
    })

    expect(document.querySelector('.ReactModal__Content')).toHaveAttribute(
      'aria-label',
      'Test Modal Label',
    )
  })

  it('allows nested interactive elements to work', async () => {
    const buttonClickHandler = vi.fn()

    await act(async () => {
      render(
        <ModalWrapper isOpen={true} ariaHideApp={false}>
          <button data-testid="modal-button" onClick={buttonClickHandler}>
            Click Me
          </button>
        </ModalWrapper>,
      )
    })

    fireEvent.click(screen.getByTestId('modal-button'))
    expect(buttonClickHandler).toHaveBeenCalled()
  })
})
