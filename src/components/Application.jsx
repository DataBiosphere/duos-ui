import React from 'react';
import { div, span, hh } from "react-hyperscript-helpers";
import { Theme } from '../theme';
import { AppSummary } from '../components/AppSummary';

const SECTION = {
  fontFamily: 'Montserrat',
  margin: '16px 0px 5px 0px',
  color: Theme.palette.primary,
};

const HEADER = {
  fontSize: Theme.font.size.header,
  lineHeight: Theme.font.leading.regular,
};

const HEADER_BOLD = {
  ...HEADER,
  fontWeight: Theme.font.weight.semibold,
}

export const Application = hh(class Application extends React.PureComponent {
  render() {
    const { voteAsChair, darInfo } = this.props;
    return div([
      div({ style: SECTION }, [
        span({ style: HEADER_BOLD }, darInfo.projectTitle),
        span({ style: HEADER }, " | " + darInfo.darCode)
      ]),
      div({ id: 'votes-summary', isRendered: voteAsChair }),
      AppSummary({ darInfo })
    ]);
  }
});
