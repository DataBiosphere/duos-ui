import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Styles} from '../libs/theme';
import lockIcon from '../images/lock-icon.png';
import SearchBar from '../components/SearchBar';
import {DACDatasetsTable, DACDatasetTableColumnOptions} from '../components/dac_dataset_table/DACDatasetsTable';
import {getSearchFilterFunctions, Notifications, searchOnFilteredList} from '../libs/utils';
import {consoleTypes} from '../components/dac_dataset_table/DACDatasetTableCellData';
import style from './DACDatasets.module.css';
import {Button} from '@mui/material';
import {DatasetService} from '../utils/DatasetService';
import {isDevEnv} from '../utils/EnvironmentUtils';

export default function DACDatasets(props) {

  const {history} = props;
  const [datasets, setDatasets] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchRef = useRef('');

  const handleSearchChange = useCallback((searchTerms) => searchOnFilteredList(
    searchTerms,
    datasets,
    getSearchFilterFunctions().datasets,
    setFilteredList
  ), [datasets]);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const dacDatasets = await DatasetService.populateDacDatasets();
        setDatasets(dacDatasets);
        setFilteredList(dacDatasets);
        setIsLoading(false);
      } catch (error) {
        Notifications.showError({text: 'Error initializing datasets table'});
      }
    };
    init();
  }, []);

  return <div style={Styles.PAGE}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '112%',
        marginLeft: '-6%',
        padding: '0 2.5%'
      }}>
      <div
        className={'left-header-section'}
        style={Styles.LEFT_HEADER_SECTION}>
        <div
          style={Styles.ICON_CONTAINER}>
          <img
            alt={'Lock Icon'}
            id={'lock-icon'}
            src={lockIcon}
            style={Styles.HEADER_IMG}/>
        </div>
        <div
          style={Styles.HEADER_CONTAINER}>
          <div
            style={{fontFamily: 'Montserrat', fontWeight: 600, fontSize: '2.8rem'}}>
            My DAC&apos;s Datasets
          </div>
          <div
            style={{fontFamily: 'Montserrat', fontSize: '1.6rem'}}>
            View the status of datasets submitted to your Data Access Committee
          </div>
        </div>
      </div>

      <SearchBar
        handleSearchChange={handleSearchChange}
        searchRef={searchRef}/>
    </div>

    <div>
      <Button
        className={style['add-button']}
        onClick={() => history.push('data_submission_form')}
        variant="outlined">
        <div style={{verticalAlign: 'center', color: '#0948B7'}}>
          <span
            aria-hidden={'true'}
            style={{marginRight: '5px'}}
            className={'glyphicon glyphicon-plus-sign'}></span>
          ADD DATASET
        </div>
      </Button>
    </div>
    <DACDatasetsTable
      datasets={filteredList}
      columns={[
        DACDatasetTableColumnOptions.DUOS_ID,
        DACDatasetTableColumnOptions.DATA_SUBMITTER,
        DACDatasetTableColumnOptions.DATASET_NAME,
        DACDatasetTableColumnOptions.DATA_CUSTODIAN,
        DACDatasetTableColumnOptions.DATA_USE,
        DACDatasetTableColumnOptions.STATUS
      ]}
      isLoading={isLoading}
      consoleType={consoleTypes.CHAIR}
    />
  </div>;

}
