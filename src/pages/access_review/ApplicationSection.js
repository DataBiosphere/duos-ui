import React from 'react';
import { div, hh } from 'react-hyperscript-helpers';
import { Theme } from '../../libs/theme';

const highlightedWords = ["race", "ethnic", "ethnicity", "transethnic", "gender", "sex", "illegal", "illicit", "stigma",
  "behavior", "drug", "alcohol", "addict", "religion", "religious", "intellect", "intelligence", "economic", "poor",
  "poverty", "marginalized", "impoverished", "SES", "socioeconomic"];

export const ApplicationSection = hh(class ApplicationSection extends React.PureComponent {


  highlightExactMatches = (highlightedWords, content) => {
    //split words on whitespace, including the whitespace in the result as its own token
    const allTokens = content.split(/(?=[ ])|(?<=[ ])/g);
    return <span> {allTokens.map((token, i) =>
      //check if token or the token without the last character (to account for punctuation and plurals) exists in list of words to highlight
      <span key={i} style={highlightedWords.includes(token) || highlightedWords.includes(token.substring(0, token.length - 1)) ? { backgroundColor: "yellow" } : {} }>
        { token } </span>)
    } </span>;
  };


  render() {
    const { header, content, headerColor } = this.props;
    return div({ style: { fontFamily: 'Arial', color: Theme.palette.primary } }, [
      div({
        style: {
          marginBottom: '5px',
          fontSize: Theme.font.size.header,
          lineHeight: Theme.font.leading.regular,
          fontWeight: Theme.font.weight.semibold,
          color: headerColor,
        }
      }, header),
      this.highlightExactMatches(highlightedWords, content)
    ]);
  }
});
