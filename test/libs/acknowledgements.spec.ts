import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as Acknowledgements from 'src/libs/acknowledgements'
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'

describe('Acknowledgements Service', () => {
  let getAcknowledgements: ReturnType<typeof vi.spyOn>
  let acceptAcknowledgments: ReturnType<typeof vi.spyOn>
  let getCurrentUserSettings: ReturnType<typeof vi.spyOn>
  let setCurrentUserSettings: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    getAcknowledgements = vi.spyOn(User, 'getAcknowledgements')
    acceptAcknowledgments = vi.spyOn(User, 'acceptAcknowledgments')
    getCurrentUserSettings = vi.spyOn(Storage, 'getCurrentUserSettings')
    setCurrentUserSettings = vi.spyOn(Storage, 'setCurrentUserSettings')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true if all acknowledgements are in storage', async () => {
    getCurrentUserSettings.mockImplementation((key: string) => key === 'acknowledgement_foo' || key === 'acknowledgement_bar')

    const result = await Acknowledgements.hasAccepted('foo', 'bar')

    expect(result).toBe(true)
    expect(getAcknowledgements).not.toHaveBeenCalled()
    expect(setCurrentUserSettings).not.toHaveBeenCalled()
  })

  it('fetches and caches acknowledgements if not in storage', async () => {
    getCurrentUserSettings.mockReturnValue(false)
    getAcknowledgements.mockResolvedValue({ foo: true, bar: true })
    setCurrentUserSettings.mockReturnValue(undefined)

    const result = await Acknowledgements.hasAccepted('foo', 'bar')

    expect(result).toBe(true)
    expect(getAcknowledgements).toHaveBeenCalledOnce()
    expect(setCurrentUserSettings).toHaveBeenCalledWith('acknowledgement_foo', true)
    expect(setCurrentUserSettings).toHaveBeenCalledWith('acknowledgement_bar', true)
  })

  it('returns false if not all acknowledgements are accepted', async () => {
    getCurrentUserSettings.mockReturnValue(false)
    getAcknowledgements.mockResolvedValue({ foo: true })
    setCurrentUserSettings.mockReturnValue(undefined)

    const result = await Acknowledgements.hasAccepted('foo', 'bar')

    expect(result).toBe(false)
  })

  it('hasSOAcceptedDAAs checks both required acknowledgements', async () => {
    getCurrentUserSettings.mockReturnValue(false)
    getAcknowledgements.mockResolvedValue({
      [Acknowledgements.Acknowledgments.broadLcaAcknowledgement]: true,
      [Acknowledgements.Acknowledgments.nihLcaAcknowledgement]: true,
    })
    setCurrentUserSettings.mockReturnValue(undefined)

    const result = await Acknowledgements.hasSOAcceptedDAAs()

    expect(result).toBe(true)
  })

  it('acceptAcknowledgments calls User.acceptAcknowledgments and caches results', async () => {
    acceptAcknowledgments.mockResolvedValue({ foo: true, bar: true })
    setCurrentUserSettings.mockReturnValue(undefined)

    await Acknowledgements.acceptAcknowledgments('foo', 'bar')

    expect(acceptAcknowledgments).toHaveBeenCalledWith('foo', 'bar')
    expect(setCurrentUserSettings).toHaveBeenCalledWith('acknowledgement_foo', true)
    expect(setCurrentUserSettings).toHaveBeenCalledWith('acknowledgement_bar', true)
  })
})
