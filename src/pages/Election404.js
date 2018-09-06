import { Component } from 'react';
import { div, h2, br, a } from 'react-hyperscript-helpers';

class Election404 extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: ''
    }
  }

  goToConsole = (e) => {
    // TBD: fix back logic ... return to ?? when coming from ???
    this.props.history.push('/admin_console')
  }

  render() {

    const { isAccessElection, isDataUseLimitations } = this.props;

    return (
      div({ className: "container " }, [
        div({ className: "row " }, [
          h2({ className: "main-title " + (isAccessElection ? 'access-color' : (isDataUseLimitations ? 'dul-color' : '')) }, [
            "Sorry, something went wrong when trying to access the election page.",
            br(),
            div({ className: "main-title-description", style: { "paddingTop": "10px" } }, ["Please, return to your console and check if the election is still open. Thanks!"] ),
          ]),
          a({
            className: "btn btn-primary vote-button " + (isAccessElection ? 'access-background' : isDataUseLimitations ? 'dul-background' : ''),
            style: { "float": "left !important", "marginTop": "15px" }, onClick: this.goToConsole
          }, ["Your Console"]),
        ]),
      ])
    );
  }
}

export default Election404;

