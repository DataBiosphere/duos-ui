import React from 'react';
import { div } from 'react-hyperscript-helpers';
import { DarApplication } from './DarApplication';
import { AccessReviewHeader } from './AccessReviewHeader';
import { DacVotePanel } from './DacVotePanel';
import { DAR } from '../../libs/ajax';

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
  };

  componentDidMount() {
    this.darReviewAccess();
  }

  async darReviewAccess() {
    const { darId } = this.props.match.params;
    const { darInfo, election, consent } = await DAR.describeDarWithElectionInfo(darId);
    this.setState({ darInfo, election, consent });
  }

  render() {
    const { voteAsChair, darInfo, election, consent } = this.state;
    const { history, match } = this.props;
    const ids = match.params;

    return div({ isRendered: darInfo != null, id: 'container', style: { margin: 'auto' } },
      [
        div(
          {
            id: 'header', style: SECTION
          },
          [AccessReviewHeader({ history, match })]
        ),
        div({ id: 'body', style: { display: 'flex' } }, [
          div(
            {
              id: 'vote',
              style: {
                ...SECTION,
                width: '30%',
              }
            },
            [DacVotePanel({ ids, darInfo, election, consent, voteAsChair, selectChair: this.selectChair })]
          ),
          div(
            {
              id: 'application',
              style: {
                ...SECTION,
                width: '70%',
              }
            },
            [DarApplication({ voteAsChair, darInfo, election, consent, ids })]
          )
        ])
      ]
    );
  }
}
export default AccessReviewV2;
