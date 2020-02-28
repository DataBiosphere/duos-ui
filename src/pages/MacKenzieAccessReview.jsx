import React from "react";
import { div } from "react-hyperscript-helpers";
import { Application } from '../components/Application';
import { AccessReviewHeader } from '../components/AccessReviewHeader';
import { VoteAsX } from '../components/VoteAsX';
import { DAR } from '../libs/ajax';

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
      voteAsChair: false,
    };
  }

  selectChair = (selected) => {
    this.setState({ voteAsChair: selected });
  }

  componentDidMount() {
    this.darReviewAccess();
  }

  async darReviewAccess() {
    const { darId, voteId } = this.props.match.params;
    const darInfo = await DAR.describeDarWithElectionInfo(darId, voteId);
    this.setState({ darInfo });
  }

  render() {
    const { voteAsChair, darInfo } = this.state;
    const { history } = this.props;

    return div({ isRendered: darInfo != null, id: "container", className: 'container-wide', style: { margin: 'auto' } },
      [
        div(
          {
            id: 'header', style: SECTION
          },
          [AccessReviewHeader({ history })]
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
            [VoteAsX({ voteAsChair, selectChair: this.selectChair })]
          ),
          div(
            {
              id: "application",
              style: {
                ...SECTION,
                width: "70%",
              }
            },
            [Application({ voteAsChair, darInfo })]
          )
        ])
      ]
    );
  }
}
export default MacKenzieAccessReview;
