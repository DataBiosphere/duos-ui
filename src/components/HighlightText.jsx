import { isNil } from 'lodash';
import React, {useCallback} from 'react';

/**
 * Checks within a text that the characters between
 * startIdx and endIdx are complete words.
 *
 * E.g.,
 *    text="Biometric", startIdx=3 (m), endIdx=8 (c) => false
 *    text="The metric", startIdx=4 (m), endIdx=9 (c) => true
 */
const punctuation = ['.', ',', ':', ';', '!', '?'];
const isStandaloneWord = (text, startIdx, endIdx) => {
  if (startIdx !== 0) {
    const char = text.charAt(startIdx-1);

    if (char.trim() !== '' && !punctuation.includes(char)) {
      return false;
    }
  }

  if (endIdx !== text.length-1) {
    const char = text.charAt(endIdx);

    if (char.trim() !== '' && !punctuation.includes(char)) {
      return false;
    }
  }

  return true;
};


const findHighlightableMatch = (highlight, text, idx) => {
  for (const highlightConfig of highlight) {
    for (const word of highlightConfig.words) {
      const textAtCurrWordLength = text.slice(idx, idx+word.length);


      const textIsStandalone = isStandaloneWord(text, idx, idx+word.length);
      const textMatchesHighlightableWord = textAtCurrWordLength.toLowerCase() === word.toLowerCase();

      if (textIsStandalone && textMatchesHighlightableWord) {
        return {
          word: textAtCurrWordLength,
          bgColor: highlightConfig.bgColor,
          textColor: highlightConfig.textColor,
        };
      }
    }
  }

  return null;
};

export const HighlightText = (props) => {
  const {
    /**
     * highlight:
     *   Specifies any number of highlight colors and words
     *   to highlight with those colors.
     * schema:
     *   [
     *    { bgColor: ..., textColor: ... , words: [ ... ] },
     *    { bgColor: ..., textColor: ... , words: [ ... ] },
     *   ]
     */
    highlight,
    text,
  } = props;

  // searches through text one character at a time
  // looking for words to highlight
  const splitAndHighlight = useCallback(() => {
    if (isNil(text)) {
      return <div></div>;
    }

    const output = [];

    const pushOutput = ({
      text,
      bgColor=undefined,
      textColor=undefined,
      fontWeight=undefined
    }) => {
      return (
        <span
          key={output.length}
          data-cy={`highlight-${output.length}`}
          style={{
            backgroundColor: bgColor,
            color: textColor,
            fontWeight: fontWeight
          }}>
          {text}
        </span>
      );
    };


    // keeps track of last unhighlighted text
    let endOfLastHighlight = 0;

    // scan through text by character
    for (let idx = 0; idx < text.length; idx++) {
      const match = findHighlightableMatch(highlight, text, idx);

      if (isNil(match)) {
        continue;
      }

      const {
        word,
        bgColor,
        textColor
      } = match;

      if (endOfLastHighlight !== idx) {
        output.push(pushOutput({
          text: text.slice(endOfLastHighlight, idx)
        }));
      }
      output.push(pushOutput({
        text: word,
        bgColor: bgColor,
        textColor: textColor,
        fontWeight: 'bold'
      }));

      // update indices:
      // idx now scans after the new highlighted word
      endOfLastHighlight = idx+word.length;
      idx = endOfLastHighlight-1;
    }

    if (endOfLastHighlight !== text.length) {
      output.push(pushOutput({text: text.slice(endOfLastHighlight, text.length)}));
    }


    return <div>
      {output}
    </div>;
  }, [highlight, text]);

  return <div>
    {splitAndHighlight()}
  </div>;

};

export default HighlightText;