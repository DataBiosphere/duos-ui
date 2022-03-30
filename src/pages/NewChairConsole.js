import {useState, useEffect, useRef, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import { Collections, User } from '../libs/ajax';
import { Notifications, searchOnFilteredList, getSearchFilterFunctions } from '../libs/utils';
import { Styles } from '../libs/theme';
import {h, div, img} from 'react-hyperscript-helpers';
import lockIcon from '../images/lock-icon.png';
import { DarCollectionTable, DarCollectionTableColumnOptions } from '../components/dar_collection_table/DarCollectionTable';
import { cancelCollectionFn, openCollectionFn, updateCollectionFn } from '../utils/DarCollectionUtils';

export default function NewChairConsole(props) {
  const [collections, setCollections] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [relevantDatasets, setRelevantDatasets] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const searchRef = useRef('');
  const filterFn = getSearchFilterFunctions().darCollections;
  const { history } = props;

  const handleSearchChange = useCallback((searchTerms) => searchOnFilteredList(
    searchTerms,
    collections,
    filterFn,
    setFilteredList
  ), [collections, filterFn]);

  useEffect(() => {
    const init = async() => {
      try {
        const [collections, datasets] = await Promise.all([
          Collections.getCollectionsByRoleName("chairperson"),
          User.getUserRelevantDatasets()
        ]);
        setCollections(collections);
        setRelevantDatasets(datasets);
        setFilteredList(collections);
        setIsLoading(false);
      } catch(error) {
        Notifications.showError({text: 'Error initializing Collections table'});
      }
    };
    init();
  }, []);

  const updateCollections = updateCollectionFn({collections, filterFn, searchRef, setCollections, setFilteredList});
  const cancelCollection = cancelCollectionFn({updateCollections});
  const openCollection = openCollectionFn({updateCollections});
  const goToVote = useCallback((collectionId) => history.push(`/dar_collection/${collectionId}`), [history]);

  return div({ style: Styles.PAGE }, [
    div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
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
            div({ style: { ...Styles.TITLE } }, [
              'Manage Data Access Request Collections',
            ]),
            div(
              {
                style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {
                  fontSize: '16px',
                }),
              },
              ['Manage your DAC\'s Data Access Requests']
            ),
          ]),
        ]
      ),
      h(SearchBar, { handleSearchChange, searchRef }),
    ]),
    h(DarCollectionTable, {
      collections: filteredList,
      columns: [
        DarCollectionTableColumnOptions.DAR_CODE,
        DarCollectionTableColumnOptions.NAME,
        DarCollectionTableColumnOptions.SUBMISSION_DATE,
        DarCollectionTableColumnOptions.PI,
        DarCollectionTableColumnOptions.INSTITUTION,
        DarCollectionTableColumnOptions.DATASET_COUNT,
        DarCollectionTableColumnOptions.STATUS,
        DarCollectionTableColumnOptions.ACTIONS,
      ],
      isLoading,
      relevantDatasets,
      cancelCollection,
      resubmitCollection: null,
      openCollection,
      goToVote,
      consoleType: 'chairperson'
    }),
  ]);


}