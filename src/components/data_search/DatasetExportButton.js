import * as React from 'react';
import { CircularProgress, IconButton, Link } from '@mui/material';
import { useState } from 'react';
import IosShareIcon from '@mui/icons-material/IosShare';
import { TerraDataRepo } from '../../libs/ajax';

export const DatasetExportButton = (props) => {
  const { snapshot, title } = props;
  // The exportStatus flow is: initial -> prepping -> ready
  // TODO: error handling?
  const [exportStatus, setExportStatus] = useState('initial');
  const [exportResult, setExportResult] = useState(null);

  // Not a supported export location
  if (!snapshot) {
    return null;
  }

  const prepExportHandler = async () => {
    setExportStatus('prepping');
    const job = await TerraDataRepo.prepareExport(snapshot.id);
    const result = await TerraDataRepo.waitForJob(job.id);
    setExportResult(result);
    setExportStatus('ready');
  };

  if (exportStatus === 'initial') {
    return (
      <IconButton aria-label="prepare export to Terra" size="medium" onClick={prepExportHandler}>
        <IosShareIcon size={15} />
      </IconButton>
    );
  }

  if (exportStatus === 'prepping') {
    return (
      <IconButton aria-label="prepare export to Terra" size="medium" onClick={() => ({})} disabled>
        <CircularProgress size={15} />,
      </IconButton>
    );
  }

  if (exportStatus === 'ready') {
    return (
      <Link href={exportResult.terraImportLink} target="_blank" rel="noopener noreferrer" title={title} aria-label={title}>Terra</Link>
    );
  }

  return null;

};

export default DatasetExportButton;
