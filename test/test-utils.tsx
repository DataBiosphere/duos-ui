import React, { ReactElement } from 'react'
import { act, render, RenderOptions, fireEvent } from '@testing-library/react'
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

export const clickById = async (id: string) => {
  await act(async () => {
    fireEvent.click(document.getElementById(id)!)
  })
}

export const typeById = async (id: string, value: string) => {
  await act(async () => {
    fireEvent.change(document.getElementById(id)!, { target: { value } })
  })
}

export const selectOptionByLabel = async (selectId: string, labelSubstring: string) => {
  const select = document.getElementById(selectId) as HTMLSelectElement
  const option = Array.from(select.options).find(o => o.textContent?.includes(labelSubstring))
  await act(async () => {
    fireEvent.change(select, { target: { value: option!.value } })
  })
}
