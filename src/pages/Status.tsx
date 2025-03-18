import React, { useState, useEffect } from 'react';
import { TaskAltOutlined, ErrorOutline } from '@mui/icons-material';
import { ServiceStatus } from '../libs/ajax/ServiceStatus';
import { ConsentStatus, OntologyStatus, SamDetails } from '../libs/ajax/ServiceStatus';

const Status = () => {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus | undefined>(undefined);
  const [ontologyStatus, setOntologyStatus] = useState<OntologyStatus | undefined>(undefined);
  const [samStatus, setSamStatus] = useState<SamDetails | undefined>(undefined);

  useEffect(() => {
    const fetchStatus = async () => {
      const consentData = await ServiceStatus.getConsentStatus();
      setConsentStatus(consentData);
      setSamStatus(consentData?.systems?.sam?.details);
      const ontologyData = await ServiceStatus.getOntologyStatus();
      setOntologyStatus(ontologyData);
    };
    fetchStatus();
  }, []);

  const healthyState = <TaskAltOutlined sx={{ marginLeft: '2rem', verticalAlign: 'middle', fontSize: '24px', color: 'green' }} />;
  const unhealthyState = <ErrorOutline sx={{ marginLeft: '2rem', verticalAlign: 'middle', fontSize: '24px', color: 'red' }} />;

  const consentHealthy = consentStatus?.ok ? healthyState : unhealthyState;
  const ontologyHealthy = ontologyStatus?.ok ? healthyState : unhealthyState;
  const samHealthy = samStatus?.ok ? healthyState : unhealthyState;

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
