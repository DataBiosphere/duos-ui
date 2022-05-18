import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { div, h, img } from 'react-hyperscript-helpers';
import {cloneDeep, map, findIndex, isEmpty, pullAt, get, flow, keys, isNil, head} from 'lodash/fp';
import TabControl from '../components/TabControl';
import { Styles } from '../libs/theme';
import { Collections, DAR } from '../libs/ajax';
import { DarCollectionTableColumnOptions, DarCollectionTable } from '../components/dar_collection_table/DarCollectionTable';
import accessIcon from '../images/icon_access.png';
import { Notifications, searchOnFilteredList, getSearchFilterFunctions } from '../libs/utils';
import SearchBar from '../components/SearchBar';
import DarDraftTable from '../components/dar_drafts_table/DarDraftTable';

//helper function with a built in delay to allow skeleton loader to show when data is loading or when the user switch tabs
//primarily done to make the tab switching more obvious
const delayedLoadingUpdate = async ({setIsLoading}) => {
  return await Promise.resolve(
    setTimeout(() => setIsLoading(false), [400])
  );
};

export default function NewResearcherConsole(props) {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('DAR Collections');
  const [researcherCollections, setResearcherCollections] = useState();
  const [researcherDrafts, setResearcherDrafts] = useState();
  const [filteredList, setFilteredList] = useState();
  const searchRef = useRef('');

  const { history } = props;

  const tabNames = {
    darCollections: 'DAR Collections',
    darDrafts: 'DAR Drafts'
  };

  //memoized references for tab-specific data and filter function
  //keys correspond with tab constants that are used to designated the selected tab
  const dataStructs = useMemo(() => ({
    [tabNames.darCollections]: {
      filterFn: getSearchFilterFunctions().darCollections,
      data: researcherCollections
    },
    [tabNames.darDrafts]: {
      filterFn: getSearchFilterFunctions().darDrafts,
      data: researcherDrafts
    }
  }), [researcherCollections, researcherDrafts, tabNames.darCollections, tabNames.darDrafts]);

  //basic helper to process promises for collections and drafts in init
  const handlePromise = (promise, setValue, errorMsg, newError) => {
    if(promise.status === 'rejected') {
      errorMsg += newError;
    } else {
      setValue(promise.value);
    }
  };

  //callback function passed to search bar to perform filter
  const handleSearchChange = useCallback(() => searchOnFilteredList(
    searchRef.current.value,
    dataStructs[selectedTab].data,
    dataStructs[selectedTab].filterFn,
    setFilteredList
  ), [selectedTab, dataStructs]);


  //sequence of init events on component load
  useEffect(() => {
    const init = async () => {
      let errorMsg = '';
      const promiseReturns = await Promise.allSettled([
        Collections.getCollectionsForResearcher(),
        DAR.getDraftDarRequestList()
      ]);
      const [fetchedCollections, fetchedDraftsPayload] = promiseReturns;
      //Need some extra formatting steps for drafts due to different payload format
      const fetchedDrafts = {
        status: fetchedDraftsPayload.status,
        value: (fetchedDraftsPayload.value || []).map((draftPayload) => draftPayload.dar)
      };
      handlePromise(
        fetchedCollections,
        setResearcherCollections,
        errorMsg,
        'Failed to fetch DAR Collection "\n"'
      );
      handlePromise(
        fetchedDrafts,
        setResearcherDrafts,
        errorMsg,
        'Failed to fetch DAR Drafts'
      );
      if(!isEmpty(errorMsg)) {
        Notifications.showError({text: errorMsg});
      }
      setFilteredList(fetchedCollections);
    };
    init();
  }, []);

  //sequence of events when user switches tab (reset search bar and filteredList)
  useEffect(() => {
    setIsLoading(true);
    searchRef.current.value = '';
    setFilteredList(dataStructs[selectedTab].data);
  }, [dataStructs, selectedTab]);

  //sequence of events when user switches tab or data is updated (perform new filter based on search query)
  useEffect(() => {
    const { data, filterFn } = dataStructs[selectedTab];
    searchOnFilteredList(
      searchRef.current.value,
      data,
      filterFn,
      setFilteredList
    );
    if(!isNil(researcherCollections) && !isNil(researcherDrafts)) {
      delayedLoadingUpdate({ setIsLoading });
    }
  }, [researcherCollections, researcherDrafts, dataStructs, selectedTab]);

  //review collection function, passed to collections table to be used in buttons
  const reviewCollection = (darCollection) => {
    try {
      const referenceId = flow(
        get('dars'),
        keys,
        head
      )(darCollection);
      if (isNil(referenceId)) {
        throw new Error("Error: Could not find target Data Access Request");
      }
      history.push(`/dar_application/${referenceId}`);
    } catch (error) {
      Notifications.showError({
        text: 'Error: Cannot view target Data Access Request'
      });
    }
  };

  //cancel collection function, passed to collections table to be used in buttons
  const cancelCollection = async (darCollection) => {
    try {
      const { darCollectionId, darCode } = darCollection;
      const canceledCollection = await Collections.cancelCollection(darCollectionId);
      const targetIndex = researcherCollections.findIndex((collection) =>
        collection.darCollectionId === darCollectionId);
      if (targetIndex < 0) {
        throw new Error("Error: Could not find target Data Access Request");
      }
      const clonedCollections = cloneDeep(researcherCollections);
      clonedCollections[targetIndex] = canceledCollection;
      setResearcherCollections(clonedCollections);
      Notifications.showSuccess({text: `Deleted Data Access Request ${darCode}`});
    } catch (error) {
      Notifications.showError({
        text: 'Error: Cannot cancel target Data Access Request'
      });
    }
  };

  //resubmit collection function, passed to collections table to be used in buttons
  const resubmitCollection = async (darCollection) => {
    try {
      const { darCollectionId, darCode } = darCollection;
      await Collections.resubmitCollection(darCollectionId);
      const targetIndex = researcherCollections.findIndex((collection) =>
        collection.darCollectionId === darCollectionId);
      if (targetIndex < 0) {
        throw new Error("Error: Could not find target Data Access Request");
      }
      //remove resubmitted collection from DAR Collection table
      const clonedCollections = cloneDeep(researcherCollections);
      const updatedCollections = pullAt(targetIndex, clonedCollections);
      setResearcherCollections(updatedCollections);
      Notifications.showSuccess({text: `Revising Data Access Request ${darCode}`});
    } catch (error) {
      Notifications.showError({
        text: 'Error: Cannot revise target Data Access Request'
      });
    }
  };

  //Draft delete, passed down to draft table to be used with delete button
  const deleteDraft = async ({ referenceId, identifier }) => {
    try {
      await DAR.deleteDar(referenceId);
      const draftsClone = cloneDeep(researcherDrafts);
      const targetIndex = findIndex((draft) => {
        return draft.referenceId === referenceId;
      })(draftsClone);
      if (targetIndex === -1) {
        Notifications.showError({ text: 'Error processing delete request' });
      } else {
        draftsClone.splice(targetIndex, 1);
        setResearcherDrafts(draftsClone);
        Notifications.showSuccess({text: `Deleted DAR Draft ${identifier}`});
      }
    } catch (error) {
      Notifications.showError({
        text: `Failed to delete DAR Draft ${identifier}`,
      });
    }

  };

  return div({ style: Styles.PAGE }, [
    div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
      div(
        { className: 'left-header-section', style: Styles.LEFT_HEADER_SECTION },
        [
          div({ style: Styles.ICON_CONTAINER }, [
            img({
              id: 'access-icon',
              src: accessIcon,
              style: Styles.HEADER_IMG,
            }),
          ]),
          div({ style: Styles.HEADER_CONTAINER }, [
            div({ style: Styles.TITLE }, ['Researcher Console']),
            div(
              {
                style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {
                  fontSize: '18px',
                }),
              },
              [`Select and manage ${selectedTab} below`]
            ),
          ]),
        ]
      ),
    ]),
    div(
      {
        className: 'researcher-console-table-header',
        style: { display: 'flex', justifyContent: 'space-between' },
      },
      [
        div({ className: 'tab-control', style: Styles.LEFT_HEADER_SECTION }, [
          h(TabControl, {
            labels: map((label) => label)(tabNames),
            selectedTab,
            setSelectedTab,
          }),
        ]),
        h(SearchBar, { handleSearchChange, searchRef }),
      ]
    ),
    div({ className: 'table-container' }, [
      h(DarCollectionTable, {
        isRendered: selectedTab === tabNames.darCollections,
        collections: filteredList,
        columns: [
          DarCollectionTableColumnOptions.DAR_CODE,
          DarCollectionTableColumnOptions.NAME,
          DarCollectionTableColumnOptions.SUBMISSION_DATE,
          DarCollectionTableColumnOptions.PI,
          DarCollectionTableColumnOptions.DATASET_COUNT,
          DarCollectionTableColumnOptions.STATUS,
          DarCollectionTableColumnOptions.ACTIONS
        ],
        isLoading,
        cancelCollection,
        resubmitCollection,
        reviewCollection,
        consoleType: 'researcher'
      }),
      h(DarDraftTable, {
        isRendered: selectedTab === tabNames.darDrafts,
        drafts: filteredList,
        isLoading,
        history,
        deleteDraft
      }),
    ]),
  ]);
}