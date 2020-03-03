import React from "react";
import { div } from "react-hyperscript-helpers";
import { DarApplication } from '../components/DarApplication';
import { AccessReviewHeader } from '../components/AccessReviewHeader';
import { DacVotePanel } from '../components/DacVotePanel';
import { DAR } from '../libs/ajax';

const SECTION = {
  margin: '16px',
};

class AccessReviewV2 extends React.PureComponent {
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
    const { darId } = this.props.match.params;
    const darInfo = await DAR.describeDarWithElectionInfo(darId);
    this.setState({ darInfo });
  }

  render() {
    const { voteAsChair, darInfo } = this.state;
    const { history, match } = this.props;

    return div({ isRendered: darInfo != null, id: "container", style: { width: '1500px', margin: 'auto' } },
      [
        div(
          {
            id: 'header', style: SECTION
          },
          [AccessReviewHeader({ history, match })]
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
            [DacVotePanel({ voteAsChair, selectChair: this.selectChair })]
          ),
          div(
            {
              id: "application",
              style: {
                ...SECTION,
                width: "70%",
              }
            },
            [DarApplication({ voteAsChair, darInfo })]
          )
        ])
      ]
    );
  }
}
export default AccessReviewV2;
