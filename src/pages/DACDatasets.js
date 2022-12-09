import { useEffect, useState, useCallback } from 'react';
import { button, div, h, span } from 'react-hyperscript-helpers';
import {DataSet, User} from '../libs/ajax';
import {Styles} from '../libs/theme';
import {img} from 'react-hyperscript-helpers';
import lockIcon from '../images/lock-icon.png';
import SearchBar from '../components/SearchBar';
import {DACDatasetTable, DACDatasetTableColumnOptions} from '../components/dac_dataset_table/DACDatasetTable';
import {getSearchFilterFunctions, Notifications, searchOnFilteredList} from '../libs/utils';
import {useRef} from 'react';
import { consoleTypes } from '../components/dac_dataset_table/DACDatasetTableCellData';
import '../components/dac_dataset_table/dac_dataset_table.css';

export default function DACDatasets(props) {
  const [datasets, setDatasets] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchRef = useRef('');
  const filterFn = getSearchFilterFunctions().datasets;
  const { history } = props;

  const handleSearchChange = useCallback((searchTerms) => searchOnFilteredList(
    searchTerms,
    datasets,
    filterFn,
    setFilteredList
  ), [datasets, filterFn]);

  const getDatasets = useCallback(async () => {
    const userDatasets = await User.getUserRelevantDatasets();
    userDatasets.map(async dataset => {
      const datasetObject = await DataSet.getDataSetsByDatasetId(dataset.dataSetId);
      dataset.dacApproval = datasetObject.dacApproval;
    });
    return userDatasets;
  }, []);

  useEffect(() => {
    const init = async() => {
      try {
        setIsLoading(true);
        // const listOfDatasets = await User.getUserRelevantDatasets();
        const listOfDatasets = await getDatasets();
        setDatasets(listOfDatasets);
        setFilteredList(listOfDatasets);
        setIsLoading(false);
      } catch (error) {
        Notifications.showError({text: 'Error initializing datasets table'});
      }
    };
    init();
  }, [getDatasets]);

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
        style: {
          width: '87%',
          margin: '0 3% 0 0',
          borderRadius: '100px',
        },
      }),
    ]),
    div([
      button({
        id: 'btn_addDataset',
        className: 'btn-primary-dac-datasets',
        onClick: () => history.push({ pathname: 'data_submission_form' }),
      }, [
        span({ className: 'add-icon glyphicon glyphicon-plus-sign ', style: {color: '#0948B7', background: '#ffffff', 'marginRight': '5px'}, 'aria-hidden': 'true'}),
        'ADD DATASET'
      ])
    ]),
    h(DACDatasetTable, {
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