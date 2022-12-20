import React, {useCallback} from 'react';

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
    let lastIndex = 0;

    // scan through text by character
    for (let idx = 0; idx < text.length; idx++) {

      // scan through all of the highlightable words to
      // see if the current index matches any of the words
      for (const highlightConfig of highlight) {
        for (const word of highlightConfig.words) {
          if (idx+word.length >= text.length) {
            continue;
          }

          const textAtCurrWordLength = text.slice(idx, idx+word.length);

          // if there is a highlightable word here, then
          // render the text up until now, and the current
          // word with the highlighted background and text
          // color.
          if (textAtCurrWordLength.toLowerCase() === word.toLowerCase()) {
            output.push(pushOutput({
              text: text.slice(lastIndex, idx)
            }));
            output.push(pushOutput({
              text: textAtCurrWordLength,
              bgColor: highlightConfig.bgColor,
              textColor: highlightConfig.textColor,
              fontWeight: 'bold'
            }));

            // update indices:
            // lastIndex now allows slicing after last highlighted word
            // idx now scans after the new highlighted word
            lastIndex = idx+word.length;
            idx = lastIndex-1;
          }
        }
      }
    }

    if (lastIndex !== text.length) {
      output.push(pushOutput({text: text.slice(lastIndex, text.length)}));
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