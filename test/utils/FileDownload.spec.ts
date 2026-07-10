import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fileDownload } from 'src/utils/FileDownload'

describe('FileDownload', () => {
  let createObjectURL: ReturnType<typeof vi.fn>
  let revokeObjectURL: ReturnType<typeof vi.fn>
  let clickSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    createObjectURL = vi.fn().mockReturnValue('blob:fake-url')
    revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL as typeof URL.createObjectURL
    URL.revokeObjectURL = revokeObjectURL as typeof URL.revokeObjectURL
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should create and trigger download with correct attributes', async () => {
    fileDownload('test content', 'test.txt', 'text/plain')

    expect(createObjectURL).toHaveBeenCalledOnce()
    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('text/plain')

    const anchor = document.querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor!.download).toBe('test.txt')
    expect(anchor!.style.display).toBe('none')
    expect(clickSpy).toHaveBeenCalledOnce()

    await Promise.resolve()

    expect(revokeObjectURL).toHaveBeenCalledOnce()
    expect(document.querySelector('a')).toBeNull()
  })

  it('should use default mime type if none provided', () => {
    fileDownload('test content', 'test.txt')

    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toBe('application/octet-stream')
  })

  it('should handle different input types', () => {
    const testCases = [
      new Uint8Array([1, 2, 3]),
      new Blob(['test']),
      new ArrayBuffer(8),
    ]

    testCases.forEach((data, index) => {
      fileDownload(data, `test-${index}`)
      const blob = createObjectURL.mock.calls[index][0] as Blob
      expect(blob).toBeInstanceOf(Blob)
    })

    expect(createObjectURL).toHaveBeenCalledTimes(testCases.length)
  })
})
