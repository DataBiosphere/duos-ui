import { Component } from 'react';
import { div, a } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';

class Election404 extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      isAccessElection: false,
      isDataUseLimitations: true,
    };
  }

  goToConsole = () => {
    this.props.history.goBack();
  };

  render() {

    return (
      div({ className: 'container container-wide' }, [
        div({ className: 'row no-margin' }, [
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding' }, [
            PageHeading({
              id: 'notFound',
              color: this.state.isAccessElection ? 'access' : this.state.isDataUseLimitations ? 'dul' : '',
              title: 'Sorry, something went wrong when trying to access the election page.',
              description: 'Please, return to your console and check if the election is still open. Thanks!',
            }),
          ]),
          a({
            id: 'btn_back',
            className: 'btn-primary btn-back f-left ' + (this.state.isAccessElection ? 'access-background' : this.state.isDataUseLimitations ? 'dul-background' : ''),
            style: { 'marginTop': '15px' },
            onClick: this.goToConsole }, ['Back to Your Console']),
        ])
      ])
    );
  }
}

export default Election404;
