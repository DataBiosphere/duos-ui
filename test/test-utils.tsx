import React, { ReactElement } from 'react'
import { act, render, RenderOptions, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

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

/**
 * Stands in for notificationService's dismissal pub/sub, so specs that mock the module still see a
 * dismissal reach every banner on screen the way it does at runtime.
 */
export const bannerDismissalBus = () => {
  const listeners = new Set<(id: string) => void>()
  return {
    subscribe: (listener: (id: string) => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    publish: (id: string) => listeners.forEach(listener => listener(id)),
    reset: () => listeners.clear(),
  }
}
