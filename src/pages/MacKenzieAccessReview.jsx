import React from "react";
import { div } from "react-hyperscript-helpers";
import { Storage } from "../libs/storage";
import Application from '../components/Application';
import AccessReviewHeader from '../components/AccessReviewHeader';

class MacKenzieAccessReview extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = this.initialState();
  }

  initialState() {
    return {
      currentUser: Storage.getCurrentUser(),
    };
  }

  render() {
    return div(
      {
        id: "container", className: 'container-wide centered normal-text primary'
      },
      [
        div({ id: 'header', style: { margin: '16px' } }, [<AccessReviewHeader currentUser={this.state.currentUser} history={this.props.history} />]),
        div({ id: "body", style: { display: "flex" } }, [
          div(
            {
              id: "voter-roles",
              style: {
                width: "30%",
                margin: '16px',
              }
            },
            [div("Vote as X")]
          ),
          div(
            {
              id: "application",
              style: {
                width: "70%",
                margin: '16px',
              }
            },
            [<Application />]
          )
        ])
      ]
    );
  }
}
export default MacKenzieAccessReview;
