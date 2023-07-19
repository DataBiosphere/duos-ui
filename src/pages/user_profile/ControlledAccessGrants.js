import { useEffect, useState, useRef, useCallback } from 'react';
import { Collections, User } from '../../libs/ajax';
import { div, h } from 'react-hyperscript-helpers';
import { Styles } from '../../libs/theme';
import { Notifications, getSearchFilterFunctions, USER_ROLES } from '../../libs/utils';
import { DarCollectionTable, DarCollectionTableColumnOptions } from '../../components/dar_collection_table/DarCollectionTable';
import { cancelCollectionFn, openCollectionFn, updateCollectionFn } from '../../utils/DarCollectionUtils';
import { consoleTypes } from '../../components/dar_collection_table/DarCollectionTableCellData';

export default function ControlledAccessGrants() {

  const [profile, setProfile] = useState({
    id: undefined
  });

  const updateCollections = updateCollectionFn({ collections, filterFn, searchRef, setCollections, setFilteredList });
  const cancelCollection = cancelCollectionFn({ updateCollections, role: USER_ROLES.chairperson });
  const goToVote = useCallback((collectionId) => history.push(`/dar_collection/${collectionId}`), [history]);

  const [isLoading, setIsLoading] = useState(true);
  const [collections, setCollections] = useState([]);
  const [relevantDatasets, setRelevantDatasets] = useState();
  const filterFn = getSearchFilterFunctions().darCollections;
  const searchRef = useRef('');
  const [filteredList, setFilteredList] = useState([]);
  
  useEffect(() => {
    const init = async () => {
        try {
            const [collections, datasets] = await Promise.all([
                Collections.getCollectionSummariesByRoleName(USER_ROLES.researcher),
                User.getUserRelevantDatasets()
            ]);
            setCollections(collections);
            setRelevantDatasets(datasets);
            setIsLoading(false);
        } catch (error) {
            Notifications.showError({ text: 'Error initializing Collections table' });
        }
    };
    init();
  }, []);

  const getUserProfile = async () => {
   const user = await User.getMe();
    setProfile({
        id: user.userId,
        role: user.use
    });
  };

  const openCollection = openCollectionFn({ updateCollections, role: USER_ROLES.chairperson });

  return div({ style: Styles.PAGE }, [
    h(DarCollectionTable, {
        collections: filteredList,
        columns: [
            DarCollectionTableColumnOptions.DAR_CODE,
            DarCollectionTableColumnOptions.NAME,
            DarCollectionTableColumnOptions.SUBMISSION_DATE,
            DarCollectionTableColumnOptions.RESEARCHER,
            DarCollectionTableColumnOptions.INSTITUTION,
            DarCollectionTableColumnOptions.DATASET_COUNT,
            DarCollectionTableColumnOptions.STATUS,
            DarCollectionTableColumnOptions.ACTIONS,
        ],
        isLoading,
        relevantDatasets,
        cancelCollection,
        reviseCollection: null,
        openCollection,
        goToVote,
        consoleType: consoleTypes.RESEARCHER
    }),
  ]);

}