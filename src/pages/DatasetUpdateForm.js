import React from 'react';
import { useState, useEffect } from 'react';

import { Notifications } from '../libs/utils';
import lockIcon from '../images/lock-icon.png';
import { Styles } from '../libs/theme';
import DatasetUpdate from '../components/data_update/DatasetUpdate';
import { DataSet } from '../libs/ajax';

export const DatasetUpdateForm = (props) => {
  const { history } = props;
  const { datasetId } = props.match.params;

  const [failedInit, setFailedInit] = useState(true);
  const [dataset, setDataset] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        setDataset(await DataSet.getDataSetsByDatasetId(datasetId));
        setFailedInit(false);
      } catch (error) {
        Notifications.showError({ text: 'Failed to load dataset' });
      }
    };
    init();
  }, [datasetId]);

  return !failedInit && <div style={Styles.PAGE} >
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '112%', marginLeft: '-6%', padding: '0 2.5%' }}>
      <div className='left-header-section' style={Styles.LEFT_HEADER_SECTION} >
        <div style={Styles.ICON_CONTAINER}>
          <img id='lock-icon' src={lockIcon} style={Styles.HEADER_IMG} />
        </div>
        <div style={Styles.HEADER_CONTAINER}>
          <div style={Styles.TITLE}>
            Dataset Update Form
            <div style={Styles.MEDIUM_DESCRIPTION}>
              This is an easy way to update a dataset in DUOS!
            </div>
          </div>
        </div>
      </div>
    </div>

    <form style={{ margin: 'auto', maxWidth: 800 }}>
      <DatasetUpdate dataset={dataset} history={history} />
    </form>
  </div>;
};

export default DatasetUpdateForm;
