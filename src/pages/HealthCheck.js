import { Component } from 'react';
import { div, p, hh } from 'react-hyperscript-helpers';


export const HealthCheck = hh(class HealthCheck extends Component {

  render() {
    return (
      div({ style: { margin: '2rem' } }, [
        p({}, 'DUOS is healthy!')
      ]));
  }

});
