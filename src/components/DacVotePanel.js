import React from 'react';
import { div, a, span, button, hh } from "react-hyperscript-helpers";
import { Theme } from '../libs/theme';
import { Storage } from "../libs/storage";
import { VoteAsMember } from './VoteAsMember';
import { VoteAsChair } from './VoteAsChair';
const ROOT = {
  height: '100%',
  fontFamily: 'Montserrat',
  fontSize: Theme.font.size.small,
  lineHeight: Theme.font.leading.dense,
  fontWeight: Theme.font.weight.semibold,
  textTransform: 'uppercase',
  color: Theme.palette.primary,
};

const TAB_UNSELECTED = {
  width: '50%',
  textAlign: 'center',
  padding: '16px',
  color: Theme.palette.secondary,
};

const TAB_SELECTED = {
  ...TAB_UNSELECTED,
  backgroundColor: Theme.palette.background.secondary,
  borderRadius: '9px 9px 0px 0px',
  color: Theme.palette.primary,
};

const VOTE_MEMBER = {
  height: 'calc(100% - 50px)',
  backgroundColor: Theme.palette.background.secondary,
  borderRadius: '0px 9px 9px 9px',
  padding: '24px'
};

const VOTE_CHAIR = {
  ...VOTE_MEMBER,
  borderRadius: '9px 0px 9px 9px',
};

const LINK = {
  color: Theme.palette.link,
  fontWeight: '400',
  textTransform: 'none',
  lineHeight: Theme.font.size.small,
};

const DIV = {
  display: 'flex',
  margin: '24px 0px',
  alignContent: 'center',
}

export const DacVotePanel = hh(class DacVotePanel extends React.PureComponent {
  render() {
    const { isChairPerson } = Storage.getCurrentUser();
    const { voteAsChair, selectChair } = this.props;
    return div({ style: ROOT },
      [
        div({ id: 'tabs', style: { display: 'flex' } }, [
          a({
            id: 'vote-as-member',
            style: voteAsChair ? TAB_UNSELECTED : TAB_SELECTED,
            onClick: () => selectChair(false),
          },
            [span({ style: { opacity: '70%' } }, "Vote As Member")]),
          a({
            id: 'vote-as-chair',
            isRendered: isChairPerson,
            style: voteAsChair ? TAB_SELECTED : TAB_UNSELECTED,
            onClick: () => selectChair(true),
          },
            [span({ style: { opacity: '70%' } }, "Vote As Chair")])
        ]),
        div({ style: voteAsChair ? VOTE_CHAIR : VOTE_MEMBER, },
          [
            VoteAsMember({ isRendered: !voteAsChair }),
            VoteAsChair({ isRendered: isChairPerson && voteAsChair }),
            div(
              { isRendered: voteAsChair, style: DIV }, [
              a({ style: LINK }, "View DUOS algorithm decision")
            ]),
            div({ style: { textAlign: 'end' } }, [button({ id: 'vote', className: 'button-contained' }, "Vote")])
          ])
      ]
    );
  }
});
