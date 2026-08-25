import React from 'react'

/**
 * Keyboard activation for the accordion card headers, which are `role="button"`
 * Boxes rather than real buttons.
 *
 * A native button handles Enter and Space for free; a div with `role="button"`
 * does not, so it has to be put in the tab order and taught both keys. This
 * matters most on the read-only Admin Console page, where expanding a row is the
 * only interaction on the page — without it, none of the pre-authorization data
 * is reachable without a mouse.
 */
export function accordionHeaderKeyboardProps(onToggle: () => void): {
  tabIndex: number
  onKeyDown: (event: React.KeyboardEvent) => void
} {
  return {
    tabIndex: 0,
    onKeyDown: (event: React.KeyboardEvent) => {
      // Only the header itself activates. Enter/Space on a nested control — the
      // bulk Approve All / Remove All buttons — bubbles up here, and swallowing
      // it would toggle the row and suppress the button's own activation.
      if (event.target !== event.currentTarget) return
      if (event.key !== 'Enter' && event.key !== ' ') return
      // Space would otherwise scroll the page.
      event.preventDefault()
      onToggle()
    },
  }
}
