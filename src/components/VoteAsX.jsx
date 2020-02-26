import React from 'react';
import { div, a, hh } from "react-hyperscript-helpers";
import { Theme } from '../theme';
import { VoteAsMember } from './VoteAsMember';
import { VoteAsChair } from './VoteAsChair';

const ROOT = {
  fontFamily: 'Montserrat',
  color: Theme.palette.primary,
  height: '100%',
  fontWeight: Theme.font.weight.semibold,
  opacity: '70%',
  fontSize: Theme.font.size.small,
  lineHeight: Theme.font.leading.dense,
  textTransform: 'uppercase',
};

const TAB_SELECTED = {
  width: '50%',
  backgroundColor: Theme.palette.background.secondary,
  borderRadius: '9px 9px 0px 0px',
  textAlign: 'center',
  padding: '16px',
  color: Theme.palette.primary,
};

const TAB_UNSELECTED = {
  width: '50%',
  textAlign: 'center',
  padding: '16px',
  color: Theme.palette.secondary,
};

export const VoteAsX = hh(class VoteAsX extends React.PureComponent {
  render() {
    const { isChairPerson } = this.props.currentUser;
    const { voteAsMember, voteAsChair, selectMember, selectChair } = this.props;
    return div({ style: ROOT },
      [
        div({ id: 'tabs', style: { display: 'flex' } }, [
          a(
            {
              id: 'vote-as-member',
              style: voteAsMember ? TAB_SELECTED : TAB_UNSELECTED,
              onClick: selectMember,
            },
            "Vote As Member"),
          a(
            {
              id: 'vote-as-chair',
              isRendered: isChairPerson,
              style: voteAsChair ? TAB_SELECTED : TAB_UNSELECTED,
              onClick: selectChair,
            },
            "Vote As Chair")
        ]),
        VoteAsMember({ isRendered: voteAsMember }),
        VoteAsChair({ isRendered: isChairPerson && voteAsChair })
      ]
    );
  }
});
