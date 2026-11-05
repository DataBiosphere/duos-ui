import { useEffect } from 'react'

/**
 * Sets `<meta name="description">` while the page is mounted, and puts back what was there before
 * (another description, or no tag) when it unmounts. An empty or absent description removes the tag.
 */
export const useMetaDescription = (description: string | undefined) => {
  useEffect(() => {
    const previous = document.head.querySelector<HTMLMetaElement>('meta[name="description"]')
    const previousContent = previous?.content
    let meta = previous
    if (description) {
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'description'
        document.head.appendChild(meta)
      }
      meta.content = description
    }
    else {
      meta?.remove()
    }

    return () => {
      if (previous) {
        previous.content = previousContent ?? ''
        if (!previous.isConnected) document.head.appendChild(previous)
      }
      else {
        meta?.remove()
      }
    }
  }, [description])
}
