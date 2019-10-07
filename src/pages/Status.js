import _ from 'lodash';
import React, { Component } from 'react';
import { span, a, div, h2, hh, hr, li, pre, ul } from 'react-hyperscript-helpers';
import { Config } from '../libs/config';


export const Status = hh(class Status extends Component {

  constructor(props) {
    super(props);
    this.state = {
      consentStatus: {},
      ontologyStatus: {},
      fireCloudStatus: {}
    };
  }

  isHealthy = (elements) => {
    const bools = _.uniq(_.map(elements, 'healthy'));
    return bools.length === 1 && bools[0];
  };

  isFCHealthy = (fcStatus) => {
    return _.get(fcStatus, 'ok', false);
  };

  async componentDidMount() {
    const consentStatusUrl = `${ await Config.getApiUrl() }`.replace('api', 'status');
    const ontologyStatusUrl = `${ await Config.getOntologyApiUrl() }/status`;
    const fireCloudStatusUrl = `${ await Config.getFireCloudUrl() }/status`;
    fetch(consentStatusUrl, { method: 'GET' })
      .then(response => response.json())
      .then(data => this.setState({ consentStatus: data }));
    fetch(ontologyStatusUrl, { method: 'GET' })
      .then(response => response.json())
      .then(data => this.setState({ ontologyStatus: data }));
    fetch(fireCloudStatusUrl, { method: 'GET' })
      .then(response => response.json())
      .then(data => this.setState({ fireCloudStatus: data }));
  }

  render() {
    const consentHealthy = this.isHealthy(this.state.consentStatus);
    const ontologyHealthy = this.isHealthy(this.state.ontologyStatus);
    const fireCloudHealthy = this.isHealthy(this.state.fireCloudStatus);
    const healthy = div({style: {background: 'url("/images/check-solid.svg") no-repeat 0 0;'}}, []);

    return (
      div({ style: { margin: '2rem' } }, [
        ul({ style: { marginTop: '2rem', listStyle: 'none', fontSize: 'x-large' } }, [
          li({}, [a({ href: '#consent' }, 'Consent'), ' ', consentHealthy ? 'Healthy': 'Unhealthy', healthy]),
          li({}, [a({ href: '#ontology' }, 'Ontology'), ' ', ontologyHealthy ? 'Healthy': 'Unhealthy']),
          li({}, [a({ href: '#firecloud' }, 'FireCloud'), ' ', fireCloudHealthy ? 'Healthy': 'Unhealthy'])
        ]),
        hr(),
        h2({}, [a({ id: 'consent' }, ['Consent Status'])]),
        pre({}, [JSON.stringify(this.state.consentStatus, null, 4)]),
        h2({}, [a({ id: 'ontology' }, ['Ontology Status'])]),
        pre({}, [JSON.stringify(this.state.ontologyStatus, null, 4)]),
        h2({}, [a({ id: 'firecloud' }, ['FireCloud Status'])]),
        pre({}, [JSON.stringify(this.state.fireCloudStatus, null, 4)])
      ]));
  }
});
