import { Component } from 'react';
import { div, button, hr } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';

class ResearcherConsole extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false
    };
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
  }

  handleOpenModal() {
    this.setState({ showModal: true });
  }

  handleCloseModal() {
    this.setState({ showModal: false });
  }


  render() {
    let currentUser = {
      displayName: 'Nadya Lopez Zalba'
    }

    return (
      div({ className: "container " }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ imgSrc: "", iconSize: "none", color: "common", title: "Welcome " + currentUser.displayName + "!", description: "These are your Data Access Request cases" }),
          ]),
        ]),
        hr({ className: "section-separator" }),

        button({}, ["Click Me!"])
      ])
    );
  }
}

export default ResearcherConsole;