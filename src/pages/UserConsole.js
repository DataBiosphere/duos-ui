import { Component } from 'react';
import { div, hr, h2, br, i, img, input } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';


class UserConsole extends Component {

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

      div({ className: "container" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ id: "memberConsole", color: "common", title: "Welcome " + currentUser.displayName + "!", description: "These are your pending cases for review" }),
          ]),
        ]),
        hr({ className: "section-separator" }),

        div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
          div({ className: "row no-margin" }, [
            h2({ className: "col-lg-7 col-md-7 col-sm-8 col-xs-12 pvotes-box-title dul-color" }, [
              img({ src: "/images/icon_dul.png", alt: "Data Use Limitations Review icon", className: "pvotes-icons" }),
              "Data Use Limitations Review",
              br({}),
              div({ className: "pvotes-box-title-description" }, [
                "Were data use limitations accurately converted to a structured format?"
              ])
            ]),

            div({ className: "col-lg-3 col-md-3 col-sm-4 col-xs-12 search-reviewed no-padding" }, [
              div({ className: "search-text" }, [
                i({ className: "glyphicon glyphicon-search dul-color" }),
                input({ type: "search", className: "form-control users-search", placeholder: "Enter search term...", "ng-model": "searchDULCases" })
              ]),
            ]),
          ]),
        ]),
      ])
    );
  }
}

export default UserConsole;
