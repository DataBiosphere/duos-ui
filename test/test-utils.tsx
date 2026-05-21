/* eslint-disable react-refresh/only-export-components */
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'

type RouterRenderOptions = RenderOptions & {
  route?: string
}

export const renderWithRouter = (
  ui: ReactElement,
  { route = '/', ...options }: RouterRenderOptions = {},
) => {
  window.history.pushState({}, 'Test page', route)

  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>,
    options,
  )
}

export * from '@testing-library/react'
export { userEvent }
