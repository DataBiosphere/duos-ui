import React from 'react';
import { getOr, isNil, map, uniq } from 'lodash/fp';
import { Component } from 'react';
import CheckboxMarkedCircleOutline from 'react-material-icon-svg/dist/CheckboxMarkedCircleOutline';
import DiameterVariant from 'react-material-icon-svg/dist/DiameterVariant';
import { getApiUrl, getOntologyUrl } from '../libs/ajax';


class Status extends Component {

  constructor(props) {
    super(props);
    this.state = {
      consentStatus: {},
      ontologyStatus: {}
    };
  }

  isConsentHealthy = (elements) => {
    return getOr(false)('ok')(elements);
  };

  isOntologyHealthy = (elements) => {
    const ok = getOr(undefined)('ok')(elements);
    if (!isNil(ok)) {
      // return the OK status from ontology if it exists
      return ok;
    } else {
      // find all values of "healthy" and ensure that they are all true
      const bools = uniq(map('healthy')(elements));
      return bools.length === 1 && bools[0];
    }
  };

  async componentDidMount() {
    const consentStatusUrl = `${ await getApiUrl() }/status`;
    const ontologyStatusUrl = `${ await getOntologyUrl() }/status`;
    fetch(consentStatusUrl, { method: 'GET' })
      .then(response => response.json())
      .then(data => this.setState({ consentStatus: data }));
    fetch(ontologyStatusUrl, { method: 'GET' })
      .then(response => response.json())
      .then(data => this.setState({ ontologyStatus: data }));
  }

  render() {
    const healthyState = <CheckboxMarkedCircleOutline fill={ 'green' } style={ { marginLeft: '2rem', verticalAlign: 'middle', height: '24px' } }/>;
    const unhealthyState = <DiameterVariant fill={ 'red' } style={ { marginLeft: '2rem', verticalAlign: 'middle', height: '24px' } }/>;
    const consentHealthy = this.isConsentHealthy(this.state.consentStatus) ? healthyState : unhealthyState;
    const ontologyHealthy = this.isOntologyHealthy(this.state.ontologyStatus) ? healthyState : unhealthyState;

    return (
      <div style={{ margin: '2rem' }}>
        <ul style={{ marginTop: '2rem', listStyle: 'none', fontSize: 'x-large' }}>
          <li><a href="#consent">Consent</a> {consentHealthy}</li>
          <li><a href="#ontology">Ontology</a> {ontologyHealthy}</li>
        </ul>
        <hr />
        <h2><a id="consent">Consent Status</a></h2>
        <pre>{JSON.stringify(this.state.consentStatus, null, 4)}</pre>
        <h2><a id="ontology">Ontology Status</a></h2>
        <pre>{JSON.stringify(this.state.ontologyStatus, null, 4)}</pre>
      </div>
    );
  }

};

export default Status;
