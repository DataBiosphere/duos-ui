import _ from 'lodash';
import { get } from 'lodash/fp';
import React, { Component } from 'react';
import { a, div, h2, hh, hr, li, pre, ul } from 'react-hyperscript-helpers';
import CheckboxMarkedCircleOutline from 'react-material-icon-svg/dist/CheckboxMarkedCircleOutline';
import DiameterVariant from 'react-material-icon-svg/dist/DiameterVariant';
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

  isConsentHealthy = (elements) => {
    return get('ok')(elements);
  };

  isOntologyHealthy = (elements) => {
    const bools = _.uniq(_.map(elements, 'healthy'));
    return bools.length === 1 && bools[0];
  };

  async componentDidMount() {
    const consentStatusUrl = `${ await Config.getApiUrl() }/status`;
    const ontologyStatusUrl = `${ await Config.getOntologyApiUrl() }/status`;
    fetch(consentStatusUrl, { method: 'GET' })
      .then(response => response.json())
      .then(data => this.setState({ consentStatus: data }));
    fetch(ontologyStatusUrl, { method: 'GET' })
      .then(response => response.json())
      .then(data => this.setState({ ontologyStatus: data }));
  }

  render() {
    const healthyState = <CheckboxMarkedCircleOutline fill={ 'green' } style={ { marginLeft: '2rem', verticalAlign: 'middle' } }/>;
    const unhealthyState = <DiameterVariant fill={ 'red' } style={ { marginLeft: '2rem', verticalAlign: 'middle' } }/>;
    const consentHealthy = this.isConsentHealthy(this.state.consentStatus) ? healthyState : unhealthyState;
    const ontologyHealthy = this.isOntologyHealthy(this.state.ontologyStatus) ? healthyState : unhealthyState;

    return (
      div({ style: { margin: '2rem' } }, [
        ul({ style: { marginTop: '2rem', listStyle: 'none', fontSize: 'x-large' } }, [
          li({}, [a({ href: '#consent' }, 'Consent'), ' ', consentHealthy]),
          li({}, [a({ href: '#ontology' }, 'Ontology'), ' ', ontologyHealthy])
        ]),
        hr(),
        h2({}, [a({ id: 'consent' }, ['Consent Status'])]),
        pre({}, [JSON.stringify(this.state.consentStatus, null, 4)]),
        h2({}, [a({ id: 'ontology' }, ['Ontology Status'])]),
        pre({}, [JSON.stringify(this.state.ontologyStatus, null, 4)])
      ]));
  }

});
