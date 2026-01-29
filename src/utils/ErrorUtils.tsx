import { ConsentError } from 'src/types/model'
import React from 'react'

export function extractError(error: unknown): string {
  const consentError = extractConsentError(error)
  if (consentError?.message) {
    return consentError.message
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'Unknown error'
}

export function extractConsentError(error: unknown): ConsentError | undefined {
  // If error is a fetch-based error with a ConsentError shape
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return error as ConsentError
  }
  return undefined
}

export function formatSectionedError(
  error: unknown,
  sectionHeaderRegex: RegExp = /^(Study|Dataset):/,
): React.ReactNode {
  const lines = String(error).split('\n').map(line => line.trim()).filter(Boolean)

  const sections: { header: string, items: string[] }[] = []
  let currentSection: { header: string, items: string[] } | null = null
  const preamble: string[] = []

  lines.forEach((line) => {
    if (sectionHeaderRegex.test(line)) {
      if (currentSection) sections.push(currentSection)
      currentSection = { header: line, items: [] }
    }
    else if (currentSection) {
      currentSection.items.push(line)
    }
    else {
      preamble.push(line)
    }
  })
  if (currentSection) sections.push(currentSection)

  return (
    <div>
      {preamble.map((line, idx) => (
        <div key={idx} style={{ fontWeight: idx === 0 ? 600 : 400, marginBottom: 4 }}>{line}</div>
      ))}
      {sections.map((section, idx) => (
        <div
          key={idx}
          style={{
            marginTop: 12,
            borderRadius: 4,
            padding: 8,
          }}
        >
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{section.header}</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {section.items.map((item, i) => (
              <li key={i} style={{ marginBottom: 2 }}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
