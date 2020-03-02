import React from 'react';
import { div, hh } from "react-hyperscript-helpers";
import { Theme } from '../libs/theme';

const ROOT = {
  height: 'calc(100% - 50px)',
  backgroundColor: Theme.palette.background.secondary,
  borderRadius: '0px 9px 9px 9px',
  padding: '24px'
};

export const VoteAsMember = hh(class VoteAsMember extends React.PureComponent {
  render() {
    return div({ id: 'member-vote', style: ROOT },
      "Member vote component!");
  }
});
