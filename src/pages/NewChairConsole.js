import { Component } from 'react';
import { a, div } from 'react-hyperscript-helpers';
import {PageHeading} from "../components/PageHeading";

class NewChairConsole extends Component {

  constructor(props) {
    super(props);
  }

  //Link back to the original dac chair console page
  //
  // It will have no content for this story, just a header
  //
  // Feature flag config enabled in dev, disabled in other environments
  //
  // See NavigationUtils in utils.js for how we're currently sorting out links based on feature flag state

  render() {
    return (
      div({ className: 'container' }, [
        div({ className: 'col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12' }, [
          PageHeading({
            id: 'newChairConsole', color: 'common', title: 'Manage Data Access Request',
            description: 'Select and manage Data Access Request for DAC review'
          }),
        a({href: '/chair_console'}, 'Link to Old DAC Chair Console.')
        ])]
      )
    );
  }
}

export default NewChairConsole;