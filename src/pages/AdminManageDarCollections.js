import {useState, useEffect, useRef, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import { Collections } from '../libs/ajax';
import { Notifications, searchOnFilteredList, getSearchFilterFunctions } from '../libs/utils';
import { Styles } from '../libs/theme';
import {h, div, img} from 'react-hyperscript-helpers';
import lockIcon from '../images/lock-icon.png';
import { DarCollectionTable, DarCollectionTableColumnOptions } from '../components/dar_collection_table/DarCollectionTable';
import { cancelCollectionFn, openCollectionFn, updateCollectionFn } from '../utils/DarCollectionUtils';

export default function AdminManageDarCollections() {
  const [collections, setCollections] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchRef = useRef('');
  const filterFn = getSearchFilterFunctions().darCollections;

  const handleSearchChange = useCallback((searchTerms) => searchOnFilteredList(
    searchTerms,
    collections,
    filterFn,
    setFilteredList
  ), [collections, filterFn]);

  useEffect(() => {
    const init = async() => {
      try {
        const collectionsResp = await Collections.getCollectionsByRoleName('admin');
        setCollections(collectionsResp);
        setFilteredList(collectionsResp);
        setIsLoading(false);
      } catch(error) {
        Notifications.showError({text: 'Error initializing Collections table'});
      }
    };
    init();
  }, []);

  const updateCollections = updateCollectionFn({collections, filterFn, searchRef, setCollections, setFilteredList});
  const cancelCollection = cancelCollectionFn({updateCollections, role: 'admin'});
  const openCollection = openCollectionFn({updateCollections});

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
            div({ style: { ...Styles.TITLE} }, [
              'Data Access Request Collections',
            ]),
            div(
              {
                style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {
                  fontSize: '16px',
                }),
              },
              ['List of all DAR Collections saved in DUOS']
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
        DarCollectionTableColumnOptions.ACTIONS
      ],
      isLoading,
      cancelCollection,
      reviseCollection: null,
      openCollection,
      consoleType: 'admin'
    }),
  ]);
}