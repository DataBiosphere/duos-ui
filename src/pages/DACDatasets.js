import { useEffect, useState, useCallback } from 'react';
import { button, div, h, span } from 'react-hyperscript-helpers';
import {DAC, DataSet, User} from '../libs/ajax';
import {Styles} from '../libs/theme';
import {img} from 'react-hyperscript-helpers';
import lockIcon from '../images/lock-icon.png';
import SearchBar from '../components/SearchBar';
import {DACDatasetsTable, DACDatasetTableColumnOptions} from '../components/dac_dataset_table/DACDatasetsTable';
import {getSearchFilterFunctions, Notifications, searchOnFilteredList} from '../libs/utils';
import {useRef} from 'react';
import { consoleTypes } from '../components/dac_dataset_table/DACDatasetTableCellData';
import '../components/dac_dataset_table/dac_dataset_table.css';
import {Storage} from '../libs/storage';
import {contains} from 'lodash/fp';
import {filter} from 'lodash/fp';
import {map, reduce} from 'lodash/fp';

const CHAIR = 'Chairperson';
const ADMIN = 'Admin';

export default function DACDatasets(props) {
  const [datasets, setDatasets] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // new changes
  const [dacs, setDacs] = useState([]);
  const [dacIDs, setDacIDs] = useState([]);
  const [userRole, setUserRole] = useState();
  const searchRef = useRef('');
  const filterFn = getSearchFilterFunctions().datasets;
  const { history } = props;

  const handleSearchChange = useCallback((searchTerms) => searchOnFilteredList(
    searchTerms,
    datasets,
    filterFn,
    setFilteredList
  ), [datasets, filterFn]);

  const reloadUserRole = useCallback(async () => {
    setIsLoading(true);
    const currentUser = Storage.getCurrentUser();
    const roles = currentUser.roles.map(r => r.name);
    const role = contains(ADMIN)(roles) ? ADMIN : CHAIR;
    let dacIDs = filter({name: CHAIR})(currentUser.roles);
    dacIDs = map('dacId')(dacIDs);
    if (role === CHAIR || ADMIN) {
      setDacIDs(dacIDs);
    }
    setUserRole(role);
    setIsLoading(false);
  }, []);

  const reloadDatasets = useCallback(async () => {
    // take list of dacs, return list of all datasets
    console.log(dacIDs);
    const dacDatasets = dacIDs.map(async(dacID) => await DAC.datasets(dacID));
    console.log(dacDatasets);
    setFilteredList(dacDatasets);
  }, [dacIDs]);

  // const getDatasets = useCallback(async () => {
  //   // todo: /me/dac/datasets uses DatasetDTO objects (which are deprecated and don't include all fields. i think we should update this endpoint if we're going to still need it to return regular Dataset objects, then you shouldn't have to do this map operation
  //   const userDatasets = await User.getUserRelevantDatasets();
  //   userDatasets.map(async dataset => {
  //     const datasetObject = await DataSet.getDataSetsByDatasetId(dataset.dataSetId);
  //     dataset.dacApproval = datasetObject.dacApproval;
  //   });
  //   return userDatasets;
  // }, []);

  useEffect(() => {
    /*const init = async() => {
      try {
        setIsLoading(true);
        const listOfDatasets = await User.getUserRelevantDatasets();
        const listOfDatasets = await getDatasets();
        setDatasets(listOfDatasets);
        setFilteredList(listOfDatasets);
        setIsLoading(false);
      } catch (error) {
        Notifications.showError({text: 'Error initializing datasets table'});
      }
    };
    init();
    */
    Promise.all([
      reloadUserRole(),
      reloadDatasets()
    ]);
  }, [reloadUserRole, reloadDatasets]);

  return div({ style: Styles.PAGE }, [
    div({ style: { display: 'flex', justifyContent: 'space-between', width: '112%', marginLeft: '-6%', padding: '0 2.5%' } }, [
      div(
        { className: 'left-header-section', style: Styles.LEFT_HEADER_SECTION },
        [
          div({ style: Styles.ICON_CONTAINER }, [
            img({
              id: 'lock-icon',
              src: lockIcon,
              style: Styles.HEADER_IMG,
            }),
          ]),
          div({ style: Styles.HEADER_CONTAINER }, [
            div({ style: {
              fontFamily: 'Montserrat',
              fontWeight: 600,
              fontSize: '2.8rem'
            } }, [
              `My DAC's Datasets`,
            ]),
            div(
              {
                style: {
                  fontFamily: 'Montserrat',
                  fontSize: '1.6rem'
                },
              },
              ['View the status of datasets submitted to your Data Access Committee']
            ),
          ]),
        ]
      ),
      h(SearchBar, {
        handleSearchChange,
        searchRef,
      }),
    ]),
    div([
      button({
        id: 'btn_addDataset',
        className: 'btn-primary-dac-datasets',
        style: {marginBottom: '5px'},
        onClick: () => history.push({ pathname: 'data_submission_form' }),
      }, [
        span({ className: 'add-icon glyphicon glyphicon-plus-sign ', style: {color: '#0948B7', background: '#ffffff', marginRight: '5px'}, 'aria-hidden': 'true'}),
        'ADD DATASET'
      ])
    ]),
    h(DACDatasetsTable, {
      datasets: filteredList,
      columns: [
        DACDatasetTableColumnOptions.DUOS_ID,
        DACDatasetTableColumnOptions.DATA_SUBMITTER,
        DACDatasetTableColumnOptions.DATASET_NAME,
        DACDatasetTableColumnOptions.DATA_CUSTODIAN,
        DACDatasetTableColumnOptions.DATA_USE,
        DACDatasetTableColumnOptions.STATUS
      ],
      isLoading,
      consoleType: consoleTypes.CHAIR,
    }),
  ]);
}