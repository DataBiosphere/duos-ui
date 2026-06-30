import { isNil } from 'src/utils/NodashUtil'
import React, { useCallback } from 'react'

interface HighlightConfig {
  bgColor: string
  textColor: string
  words: string[]
}

export interface HighlightTextProps {
  highlight: HighlightConfig[]
  text?: string
}

interface MatchResult {
  word: string
  bgColor: string
  textColor: string
}

interface SpanArgs {
  text: string
  bgColor?: string
  textColor?: string
  fontWeight?: string
}

const punctuation = new Set(['.', ',', ':', ';', '!', '?'])

const isStandaloneWord = (text: string, startIdx: number, endIdx: number): boolean => {
  if (startIdx !== 0) {
    const char = text.charAt(startIdx - 1)
    if (char.trim() !== '' && !punctuation.has(char)) {
      return false
    }
  }

  if (endIdx !== text.length - 1) {
    const char = text.charAt(endIdx)
    if (char.trim() !== '' && !punctuation.has(char)) {
      return false
    }
  }

  return true
}

const findHighlightableMatch = (highlight: HighlightConfig[], text: string, idx: number): MatchResult | null => {
  for (const highlightConfig of highlight) {
    for (const word of highlightConfig.words) {
      const textAtCurrWordLength = text.slice(idx, idx + word.length)
      const textIsStandalone = isStandaloneWord(text, idx, idx + word.length)
      const textMatchesHighlightableWord = textAtCurrWordLength.toLowerCase() === word.toLowerCase()

      if (textIsStandalone && textMatchesHighlightableWord) {
        return {
          word: textAtCurrWordLength,
          bgColor: highlightConfig.bgColor,
          textColor: highlightConfig.textColor,
        }
      }
    }
  }

  return null
}

export const HighlightText = (props: Readonly<HighlightTextProps>) => {
  const { highlight, text } = props

  const splitAndHighlight = useCallback(() => {
    if (isNil(text)) {
      return <div></div>
    }

    const output: React.ReactElement[] = []

    const pushSpan = (spanArgs: SpanArgs): React.ReactElement => (
      <span
        key={output.length}
        data-cy={`highlight-${output.length}`}
        style={{
          backgroundColor: spanArgs.bgColor,
          color: spanArgs.textColor,
          fontWeight: spanArgs.fontWeight,
        }}
      >
        {spanArgs.text}
      </span>
    )

    let endOfLastHighlight = 0
    let idx = 0

    while (idx < text.length) {
      const match = findHighlightableMatch(highlight, text, idx)

      if (isNil(match)) {
        idx++
        continue
      }

      const { word, bgColor, textColor } = match

      if (endOfLastHighlight !== idx) {
        output.push(pushSpan({ text: text.slice(endOfLastHighlight, idx) }))
      }
      output.push(pushSpan({ text: word, bgColor, textColor, fontWeight: 'bold' }))

      endOfLastHighlight = idx + word.length
      idx = endOfLastHighlight
    }

    if (endOfLastHighlight !== text.length) {
      output.push(pushSpan({ text: text.slice(endOfLastHighlight, text.length) }))
    }

    return <div>{output}</div>
  }, [highlight, text])

  return <div>{splitAndHighlight()}</div>
}

export default HighlightText
