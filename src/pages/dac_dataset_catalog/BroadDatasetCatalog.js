import React from 'react';
import '../DatasetCatalog';
import BroadLogoIcon from '../../images/broad_logo.png';
import DatasetCatalog from '../DatasetCatalog';
import './custom_dataset_catalogs.css';

export const BroadDatasetCatalog = (props) => {
  return <div>
    <DatasetCatalog
      customDacDatasetPage={{
        icon: BroadLogoIcon,
        dacName: 'Broad Institute',
        dacIds: [10],
        color: 'broad',
      }}
      history={props.history}
    />
  </div>;
};

export default BroadDatasetCatalog;