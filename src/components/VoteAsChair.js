import React from 'react';
import { div, hh } from "react-hyperscript-helpers";
import { Theme } from '../libs/theme';

const ROOT = {
  height: 'calc(100% - 50px)',
  backgroundColor: Theme.palette.background.secondary,
  borderRadius: '9px 0px 9px 9px',
  padding: '24px'
};

export const VoteAsChair = hh(class VoteAsChair extends React.PureComponent {
  render() {
    return div({ id: 'chair-vote', style: ROOT },
      "Chair vote component!");
  }
});
