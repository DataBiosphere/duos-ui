import { Component } from 'react';
import { div, button, hr } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';

class ReviewedCases extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: ''
    }

    this.myHandler = this.myHandler.bind(this);
  }

  myHandler(event) {
    // TBD
  }

  render() {

    return (
      div({ className: "container " }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ imgSrc: "../images/icon_reviewed.png", iconSize: "medium", color: "common", title: "Reviewed Cases Record", description: "List of Reviewed cases and their results" }),
          ]),
        ]),
        hr({ className: "section-separator" }),

        button({}, ["Click Me!"])
      ])
    );
  }
}

export default ReviewedCases;

