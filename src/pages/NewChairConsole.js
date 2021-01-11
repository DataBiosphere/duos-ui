import { Component } from 'react';
import { a, div } from 'react-hyperscript-helpers';
import {PageHeading} from "../components/PageHeading";

class NewChairConsole extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    const titleStyle = {
      color: '#1F3B50',
      fontFamily: 'Montserrat',
      fontSize: '28px',
      fontWeight: 600
    };

    const descriptionStyle = {
      color: '#1F3B50',
      fontFamily: 'Montserrat',
      fontSize: '14px',
      fontStyle: 'normal'
    };

    return (
      div({ className: 'container' }, [
        div({ className: 'col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12' }, [
          PageHeading({
            id: 'chairConsole', title: 'Manage Data Access Request',
            description: 'Select and manage Data Access Request for DAC review',
            imgSrc: '/images/lock-icon.png',
            iconSize: 'large',
            titleStyle: titleStyle,
            descriptionStyle: descriptionStyle
          }),
          a({href: '/chair_console'}, 'Link to Old DAC Chair Console.')
        ])]
      )
    );
  }
}

export default NewChairConsole;