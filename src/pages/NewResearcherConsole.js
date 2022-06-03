import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { div, h, img } from 'react-hyperscript-helpers';
import {cloneDeep, map, findIndex, isEmpty, get, flow, keys, isNil, head, concat, replace} from 'lodash/fp';
import { Styles } from '../libs/theme';
import { Collections, DAR } from '../libs/ajax';
import { DarCollectionTableColumnOptions, DarCollectionTable } from '../components/dar_collection_table/DarCollectionTable';
import accessIcon from '../images/icon_access.png';
import { Notifications, searchOnFilteredList, getSearchFilterFunctions } from '../libs/utils';
import SearchBar from '../components/SearchBar';

export default function NewResearcherConsole(props) {
  const [isLoading, setIsLoading] = useState(true);
  const [researcherCollections, setResearcherCollections] = useState();
  // const [researcherDrafts, setResearcherDrafts] = useState();
  const [filteredList, setFilteredList] = useState();
  const searchRef = useRef('');

  const filterFn = getSearchFilterFunctions().darCollections;
  const { history } = props;

  // const tabNames = {
  //   darCollections: 'DAR Collections',
  //   darDrafts: 'DAR Drafts'
  // };

  // //memoized references for tab-specific data and filter function
  // //keys correspond with tab constants that are used to designated the selected tab
  // const dataStructs = useMemo(() => ({
  //   [tabNames.darCollections]: {
  //     filterFn: getSearchFilterFunctions().darCollections,
  //     data: researcherCollections
  //   },
  //   [tabNames.darDrafts]: {
  //     filterFn: getSearchFilterFunctions().darDrafts,
  //     data: researcherDrafts
  //   }
  // }), [researcherCollections, researcherDrafts, tabNames.darCollections, tabNames.darDrafts]);

  //basic helper to process promises for collections and drafts in init
  const handlePromise = (promise, targetArray, errorMsg, newError) => {
    if(promise.status === 'rejected') {
      errorMsg.push(newError)
    } else {
      return concat(targetArray, promise.value);
    }
  };

  const formatDraft = (draft) => {
    const { data, referenceId } = draft;
    const {
      partialDarCode,
      projectTitle,
      datasets,
      isThePi,
      piName,
      investigator,
    } = data;
    return {
      darCode: replace('temp', 'DRAFT')(partialDarCode),
      referenceId,
      title: projectTitle,
      isDraft: true,
      createDate: undefined,
      datasets,
      createUser: {
        displayName: investigator,
        properties: {
          isThePi,
          piName,
        },
      },
    };
  };

  const formatDrafts = useMemo(() => map(formatDraft), []);

  //callback function passed to search bar to perform filter
  const handleSearchChange = useCallback(() => searchOnFilteredList(
    searchRef.current.value,
    researcherCollections,
    filterFn,
    setFilteredList
  ), [researcherCollections, filterFn]);


  //sequence of init events on component load
  useEffect(() => {
    const init = async () => {
      let errorMsg = [];
      const promiseReturns = await Promise.allSettled([
        Collections.getCollectionsForResearcher(),
        DAR.getDraftDarRequestList()
      ]);
      const [fetchedCollections, fetchedDraftsPayload] = promiseReturns;
      //Need some extra formatting steps for drafts due to different payload format
      const fetchedDrafts = {
        status: fetchedDraftsPayload.status,
        // value: (fetchedDraftsPayload.value || []).map((draftPayload) => draftPayload.dar)
        value: flow(
          map((draftPayload) => draftPayload.dar),
          formatDrafts
        )(fetchedDraftsPayload.value || []) //NOTE: check to see if this works
      };
      let collectionArray = [];
      handlePromise(
        fetchedCollections,
        collectionArray,
        errorMsg,
        'Failed to fetch DAR Collection'
      );
      handlePromise(
        fetchedDrafts,
        collectionArray,
        errorMsg,
        'Failed to fetch DAR Drafts'
      );
      if(!isEmpty(errorMsg)) {
        Notifications.showError({text: errorMsg.join('\n')});
      }
      setResearcherCollections(collectionArray);
      setFilteredList(collectionArray);
      setIsLoading(false);
    };
    init();
  }, [formatDrafts]);

  //sequence of events when user switches tab or data is updated (perform new filter based on search query)
  useEffect(() => {
    searchOnFilteredList(
      searchRef.current.value,
      researcherCollections,
      filterFn,
      setFilteredList
    );
  }, [researcherCollections, filterFn]);

  //review collection function, passed to collections table to be used in buttons
  const reviewCollection = (darCollection) => {
    try {
      const referenceId = flow(
        get('dars'),
        keys,
        head
      )(darCollection);
      if (isNil(referenceId)) {
        throw new Error('Error: Could not find target Data Access Request');
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
        throw new Error('Error: Could not find target Data Access Request');
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

  //revise collection function, passed to collections table to be used in buttons
  //NOTE: check if logic holds, write tests if needed
  const reviseCollection = async (darCollection) => {
    try {
      const { darCollectionId, darCode } = darCollection;
      const draftCollection = await Collections.reviseCollection(darCollectionId);
      const targetIndex = researcherCollections.findIndex((collection) =>
        collection.darCollectionId === darCollectionId);
      if (targetIndex < 0) {
        throw new Error('Error: Could not find target Data Access Request');
      }
      //remove resubmitted collection from DAR Collection table
      const clonedCollections = cloneDeep(researcherCollections);
      clonedCollections[targetIndex] = formatDraft(draftCollection);
      setResearcherCollections(clonedCollections);
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
      const collectionsClone = cloneDeep(researcherCollections);
      const targetIndex = findIndex((draft) => {
        return draft.referenceId === referenceId;
      })(collectionsClone);
      if (targetIndex === -1) {
        Notifications.showError({ text: 'Error processing delete request' });
      } else {
        collectionsClone.splice(targetIndex, 1);
        setResearcherCollections(collectionsClone);
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
              [`Select and manage DAR Collections below`]
            ),
          ]),
        ]
      ),
      h(SearchBar, { handleSearchChange, searchRef }),
    ]),
    div({ className: 'table-container' }, [
      h(DarCollectionTable, {
        collections: filteredList,
        columns: [
          DarCollectionTableColumnOptions.DAR_CODE,
          DarCollectionTableColumnOptions.NAME,
          DarCollectionTableColumnOptions.SUBMISSION_DATE,
          DarCollectionTableColumnOptions.PI,
          DarCollectionTableColumnOptions.DATASET_COUNT,
          DarCollectionTableColumnOptions.STATUS,
          DarCollectionTableColumnOptions.ACTIONS,
        ],
        isLoading,
        cancelCollection,
        reviseCollection,
        reviewCollection,
        deleteDraft,
        consoleType: 'researcher',
      })
    ]),
  ]);
}