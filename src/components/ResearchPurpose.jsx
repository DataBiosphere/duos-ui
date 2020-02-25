import React from 'react';
import { div } from "react-hyperscript-helpers";
import { Theme } from '../theme';

class ResearchPurpose extends React.PureComponent {
  render() {
    return div({ style: { fontFamily: 'Montserrat' } }, [
      div({
        style: {
          marginBottom: '5px',
          fontSize: Theme.font.size.header,
          lineHeight: Theme.font.leading.regular,
          fontWeight: Theme.font.weight.semibold,
        }
      }, "Research Purpose"),
      div({
        style: {
          fontSize: Theme.font.size.small,
          lineHeight: Theme.font.leading.regular,
        }
      }, "[Research Use Statement]")
    ]);
  }
}
export default ResearchPurpose;
