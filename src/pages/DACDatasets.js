import React, {useCallback, useEffect, useRef, useState} from 'react';
import {DAC} from '../libs/ajax';
import {Styles} from '../libs/theme';
import lockIcon from '../images/lock-icon.png';
import SearchBar from '../components/SearchBar';
import {DACDatasetsTable, DACDatasetTableColumnOptions} from '../components/dac_dataset_table/DACDatasetsTable';
import {getSearchFilterFunctions, Notifications, searchOnFilteredList, USER_ROLES} from '../libs/utils';
import {consoleTypes} from '../components/dac_dataset_table/DACDatasetTableCellData';
import style from './DACDatasets.module.css';
import {Storage} from '../libs/storage';
import {filter, flow, isNil, map} from 'lodash/fp';
import {Button} from '@mui/material';
import {getDataUseTranslations} from '../utils/DatasetUtils';

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

  /**
   * Async utility to find all datasets a DAC Chairperson
   * has access to and populate their data use codes and translations
   * @returns {Promise<Awaited<{translations: ([]|[]|Awaited<unknown>[]), codeList: (string|string)}>[]>}
   */
  const populateDacDatasets = async () => {
    // Find all Chairperson DAC Ids for the user
    const user = Storage.getCurrentUser();
    const dacIds = flow(
      filter(r => r.name === USER_ROLES.chairperson),
      map('dacId'),
      filter(id => !isNil(id))
    )(user.roles);
    // find all datasets for all DACs the user has access to.
    const dacDatasets = (await Promise.all(dacIds.map(id => DAC.datasets(id)))).flat();
    // Enrich datasets with data use translations
    return await Promise.all(map(async (d) => {
      const {codeList, translations} = await getDataUseTranslations(d);
      return Object.assign({}, d, {codeList: codeList, translations: translations});
    })(dacDatasets));
  };

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const enrichedDatasets = await populateDacDatasets();
        setDatasets(enrichedDatasets);
        setFilteredList(enrichedDatasets);
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
        onClick={() => history.push({pathname: 'dataset_registration'})}
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
