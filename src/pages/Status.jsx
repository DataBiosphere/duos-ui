import React, { useState, useEffect } from 'react';
import { getOr, isNil, map, uniq } from 'lodash/fp';
import { TaskAltOutlined, ErrorOutline } from '@mui/icons-material';
import { ServiceStatus } from '../libs/ajax/ServiceStatus';

const Status = () => {
  const [consentStatus, setConsentStatus] = useState({});
  const [ontologyStatus, setOntologyStatus] = useState({});
  const [samStatus, setSamStatus] = useState({});

  const isConsentHealthy = (elements) => {
    return getOr(false)('ok')(elements);
  };

  const isOntologyHealthy = (elements) => {
    const ok = getOr(undefined)('ok')(elements);
    if (!isNil(ok)) {
      return ok;
    } else {
      const bools = uniq(map('healthy')(elements));
      return bools.length === 1 && bools[0];
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      const consentData = await ServiceStatus.getConsentStatus();
      setConsentStatus(consentData);
      setSamStatus(consentData.systems.sam.details);

      const ontologyData = await ServiceStatus.getOntologyStatus();
      setOntologyStatus(ontologyData);
    };
    fetchStatus();
  }, []);

  const healthyState = <TaskAltOutlined sx={{ marginLeft: '2rem', verticalAlign: 'middle', fontSize: '24px', color: 'green' }} />;
  const unhealthyState = <ErrorOutline sx={{ marginLeft: '2rem', verticalAlign: 'middle', fontSize: '24px', color: 'red' }} />;

  const consentHealthy = isConsentHealthy(consentStatus) ? healthyState : unhealthyState;
  const ontologyHealthy = isOntologyHealthy(ontologyStatus) ? healthyState : unhealthyState;
  const samHealthy = isConsentHealthy(samStatus) ? healthyState : unhealthyState;

  return (
    <div style={{ margin: '2rem' }}>
      <ul style={{ marginTop: '2rem', listStyle: 'none', fontSize: 'x-large' }}>
        <li><a href="#consent">Consent</a> {consentHealthy}</li>
        <li><a href="#ontology">Ontology</a> {ontologyHealthy}</li>
        <li><a href="#sam">Sam</a> {samHealthy}</li>
      </ul>
      <hr />
      <h2><a id="consent">Consent Status</a></h2>
      <pre>{JSON.stringify(consentStatus, null, 4)}</pre>
      <h2><a id="ontology">Ontology Status</a></h2>
      <pre>{JSON.stringify(ontologyStatus, null, 4)}</pre>
    </div>
  );
};

export default Status;
