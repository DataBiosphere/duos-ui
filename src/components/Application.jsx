import React from 'react';
import { div, hh } from "react-hyperscript-helpers";
import { Theme } from '../theme';
import { AppSummary } from '../components/AppSummary';
import { ApplicationSection } from './ApplicationSection';

const HEADER = {
  fontFamily: 'Montserrat',
  fontSize: Theme.font.size.header,
  lineHeight: Theme.font.leading.regular,
  fontWeight: Theme.font.weight.semibold,
  color: Theme.palette.primary,
  margin: '16px 0px 5px 0px'
};

export const Application = hh(class Application extends React.PureComponent {
  render() {
    const { currentUser, voteAsChair } = this.props;
    return div([
      div({ style: HEADER }, "Application header"),
      div({ id: 'votes-summary', isRendered: currentUser.isChairPerson && voteAsChair }),
      AppSummary()
    ]);
  }
});