import React from 'react';
import DOMPurify from 'dompurify';
import { div, hh, span } from 'react-hyperscript-helpers';
import { Theme } from '../../libs/theme';
import {highlightExactMatches} from '../../libs/utils';

const highlightedWords = ['race', 'ethnic', 'ethnicity', 'transethnic', 'gender', 'sex', 'illegal', 'illicit', 'stigma',
  'behavior', 'drug', 'alcohol', 'addict', 'religion', 'religious', 'intellect', 'intelligence', 'economic', 'poor',
  'poverty', 'marginalized', 'impoverished', 'SES', 'socioeconomic'];

export const ApplicationSection = hh(class ApplicationSection extends React.PureComponent {

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
      span({dangerouslySetInnerHTML: {__html: DOMPurify.sanitize(highlightExactMatches(highlightedWords, content))}})
    ]);
  }
});
