import React from "react";
import { div } from "react-hyperscript-helpers";
import { Storage } from "../libs/storage";
import { Application } from '../components/Application';
import { AccessReviewHeader } from '../components/AccessReviewHeader';
import { VoteAsX } from '../components/VoteAsX';

const SECTION = {
  margin: '16px',
};

class MacKenzieAccessReview extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = this.initialState();
  }

  initialState() {
    return {
      currentUser: Storage.getCurrentUser(),
      voteAsMember: true,
      voteAsChair: false,
    };
  }

  selectMember = () => {
    this.setState({ voteAsMember: true, voteAsChair: false });
  }

  selectChair = () => {
    this.setState({ voteAsMember: false, voteAsChair: true });
  }

  render() {
    const { currentUser, voteAsMember, voteAsChair } = this.state;
    const { history } = this.props;
    return div({ id: "container", style: { width: '1500px', margin: 'auto' } },
      [
        div(
          {
            id: 'header', style: SECTION
          },
          [AccessReviewHeader({ currentUser, history })]
        ),
        div({ id: "body", style: { display: "flex" } }, [
          div(
            {
              id: "vote",
              style: {
                ...SECTION,
                width: "30%",
              }
            },
            [VoteAsX({ currentUser, voteAsMember, voteAsChair, selectMember: this.selectMember, selectChair: this.selectChair })]
          ),
          div(
            {
              id: "application",
              style: {
                ...SECTION,
                width: "70%",
              }
            },
            [Application({ currentUser, voteAsChair })]
          )
        ])
      ]
    );
  }
}
export default MacKenzieAccessReview;
