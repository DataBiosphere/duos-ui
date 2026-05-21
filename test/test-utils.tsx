import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

type RouterRenderOptions = RenderOptions & {
  route?: string
}

export const renderWithRouter = (
  ui: ReactElement,
  { route = '/', ...options }: RouterRenderOptions = {},
) => {
  globalThis.history.pushState({}, 'Test page', route)

  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>,
    options,
  )
}
