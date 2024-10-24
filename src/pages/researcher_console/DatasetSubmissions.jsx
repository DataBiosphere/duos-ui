import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Styles, Theme} from '../../libs/theme';
import lockIcon from '../../images/lock-icon.png';
import {Link} from 'react-router-dom';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import {getSearchFilterFunctions, Notifications, searchOnFilteredList} from '../../libs/utils';
import SearchBar from '../../components/SearchBar';
import { DataSet } from '../../libs/ajax/DataSet';
import DatasetSubmissionsTable from './DatasetSubmissionsTable';
import {Storage} from '../../libs/storage';
import styles from './DatasetTerms.module.css';

export default function DatasetSubmissions(props) {

  const {history} = props;
  const [terms, setTerms] = useState([]);
  const [filteredTerms, setFilteredTerms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({});
  const searchRef = useRef('');

  useEffect(() => {
    const init = async () => {
      const user = Storage.getCurrentUser();
      setCurrentUser(user);
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
                'bool': {
                  'should': [
                    {
                      'term': {
                        'createUserId': {
                          'value': user.userId
                        }
                      }
                    },
                    {
                      'term': {
                        'study.dataSubmitterId': {
                          'value': user.userId
                        }
                      }
                    },
                    {
                      'term': {
                        'study.dataCustodianEmail': {
                          'value': user.email
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      };
      setIsLoading(true);
      try {
        const queryTerms = await DataSet.searchDatasetIndex(query);
        setTerms(queryTerms);
        setFilteredTerms(queryTerms);
      } catch (error) {
        Notifications.showError({text: 'Error initializing datasets table'});
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const handleSearchChange = useCallback((searchTerms) => searchOnFilteredList(
    searchTerms,
    terms,
    getSearchFilterFunctions().datasetTerms,
    setFilteredTerms
  ), [terms]);

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

  const addDatasetButton = (currentUser.isDataSubmitter)
    ? <button style={addDatasetButtonStyle}>
      <AddCircleOutlineIcon/><Link to={'/data_submission_form'} style={{marginLeft: 5}}>Add Dataset</Link>
    </button>
    : <button style={Object.assign({}, addDatasetButtonStyle, {cursor: 'not-allowed'})} disabled={true}>
      <AddCircleOutlineIcon/><span style={{marginLeft: 5}}>Add Dataset</span>
    </button>;

  return (
    <div style={Styles.PAGE}>
      <div className={styles['submitted-datasets-header']}>
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
              My Data Submissions
            </div>
            <div
              style={{fontFamily: 'Montserrat', fontSize: '1.6rem'}}>
              View the status of datasets registered in DUOS
            </div>
            <div>{addDatasetButton}</div>
          </div>
        </div>
        <div className={`right-header-section ${styles['search-box-container']}`}>
          <SearchBar
            handleSearchChange={handleSearchChange}
            searchRef={searchRef}/>
        </div>
      </div>
      <div className={styles['term-table-container']}>
        <DatasetSubmissionsTable terms={filteredTerms} isLoading={isLoading} history={history}/>
      </div>
    </div>
  );
}