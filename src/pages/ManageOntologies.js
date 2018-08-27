import { Component } from 'react';
import { div, button, hr } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';


class ManageOntologies extends Component {

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
      div({ className: "container" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ imgSrc: "../images/icon-manage-ontology.png", iconSize: "large", color: "common", title: "Manage Ontologies", description: "Select and manage Ontologies for index" }),
          ]),
        ]),
        hr({ className: "section-separator" }),

        button({}, ["Click Me!"])
      ])
    );
  }
}

export default ManageOntologies;

