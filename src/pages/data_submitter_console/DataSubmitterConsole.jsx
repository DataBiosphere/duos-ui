import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Styles, Theme} from '../../libs/theme';
import lockIcon from '../../images/lock-icon.png';
import {Link} from 'react-router-dom';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import {getSearchFilterFunctions, Notifications, searchOnFilteredList} from '../../libs/utils';
import SearchBar from '../../components/SearchBar';
import {DataSet} from '../../libs/ajax';
import DataSubmitterDatasetsTable from './DataSubmitterDatasetsTable';
import {Storage} from '../../libs/storage';

export default function DataSubmitterConsole() {

  const [datasets, setDatasets] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchRef = useRef('');

  useEffect(() => {
    const init = async () => {
      const user = Storage.getCurrentUser();
      const query = {
        'from': 0,
        'size': 10000,
        'query': {
          'bool': {
            'must': [
              {
                'match': {
                  '_type': 'dataset'
                }
              },
              {
                'term': {
                  'createUserId': { 'value': user.userId }
                }
              }
            ]
          }
        }
      };

      setIsLoading(true);
      try {
        const myDatasets = await DataSet.searchDatasetIndex(query);
        setDatasets(myDatasets);
        setFilteredList(myDatasets);
      } catch (error) {
        Notifications.showError({text: 'Error initializing datasets table'});
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const handleSearchChange = useCallback((searchTerms) => searchOnFilteredList(
    searchTerms,
    datasets,
    getSearchFilterFunctions().datasets,
    setFilteredList
  ), [datasets]);

  const addDatasetButtonStyle = {
    color: Theme.palette.link,
    backgroundColor: 'white',
    border: '1px solid',
    borderColor: Theme.palette.link,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.45rem',
    padding: '3%',
    cursor: 'default',
    textTransform: 'uppercase',
    fontWeight: 600,
    marginRight: 5,
    marginTop: 10
  };

  return (
    <div style={Styles.PAGE}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '112%',
          marginLeft: '-6%',
          padding: '0 2.5%'
        }}>
        <div className={'left-header-section'} style={Styles.LEFT_HEADER_SECTION}>
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
              style={Styles.TITLE}>
              My Submitted Datasets
            </div>
            <div
              style={{fontFamily: 'Montserrat', fontSize: '1.6rem'}}>
              View the status of datasets registered in DUOS
            </div>
            <div>
              <button style={addDatasetButtonStyle}>
                <AddCircleOutlineIcon/><Link to={'/data_submission_form'} style={{marginLeft: 5}}>Add Dataset</Link>
              </button>
            </div>
          </div>
        </div>
        <div className={'right-header-section'} style={{width: '50%', display: 'flex', justifyContent: 'flex-end'}}>
          <SearchBar
            handleSearchChange={handleSearchChange}
            searchRef={searchRef}/>
        </div>
      </div>
      <div style={{
        width: '100%',
        marginTop: 10,
        marginLeft: 25
      }}>
        <DataSubmitterDatasetsTable datasets={filteredList} isLoading={isLoading}/>
      </div>
    </div>
  );
}