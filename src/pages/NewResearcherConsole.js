import { useState, useEffect, useRef, useCallback } from 'react';
import { div, h, img } from 'react-hyperscript-helpers';
import {cloneDeep, map, findIndex, isEmpty, flow, concat, replace, get, head, keys} from 'lodash/fp';
import { Styles } from '../libs/theme';
import { Collections, DAR } from '../libs/ajax';
import { DarCollectionTableColumnOptions, DarCollectionTable } from '../components/dar_collection_table/DarCollectionTable';
import accessIcon from '../images/icon_access.png';
import { Notifications, searchOnFilteredList, getSearchFilterFunctions } from '../libs/utils';
import SearchBar from '../components/SearchBar';

const createPropertiesForDraft = (keys, values) =>
  keys.map((propertyKey, index) => ({
    propertyKey,
    propertyValue: values[index],
  }));

const formatDraft = (draft) => {
  const { data, referenceId, id } = draft;
  const {
    partialDarCode,
    projectTitle,
    datasets,
    isThePi,
    piName,
    institution,
    investigator,
  } = data;

  const keys = ['isThePi', 'piName'];
  const values = [isThePi, piName];
  const output =  {
    darCode: replace('temp', 'DRAFT')(partialDarCode),
    referenceId,
    darCollectionId: id,
    projectTitle,
    isDraft: true,
    createDate: 'Unsubmitted',
    datasets,
    institution,
    createUser: {
      displayName: investigator,
      properties: createPropertiesForDraft(keys, values),
    },
  };
  return output;
};

const filterFn = getSearchFilterFunctions().darCollections;

export default function NewResearcherConsole(props) {
  const [isLoading, setIsLoading] = useState(true);
  const [researcherCollections, setResearcherCollections] = useState();
  const [filteredList, setFilteredList] = useState();
  const searchRef = useRef('');

  const { history } = props;

  //basic helper to process promises for collections and drafts in init
  const handlePromise = (promise, targetArray, errorMsg, newError) => {
    if(promise.status === 'rejected') {
      errorMsg.push(newError);
    } else {
      return concat(targetArray, promise.value);
    }
  };

  //callback function passed to search bar to perform filter
  const handleSearchChange = useCallback(() => searchOnFilteredList(
    searchRef.current.value,
    researcherCollections,
    filterFn,
    setFilteredList
  ), [researcherCollections]);


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
        value: flow(
          map((draftPayload) => draftPayload.dar),
          map(formatDraft),
        )(fetchedDraftsPayload.value || [])
      };
      let collectionArray = [];
      collectionArray = handlePromise(
        fetchedCollections,
        collectionArray,
        errorMsg,
        'Failed to fetch DAR Collection'
      );
      collectionArray = handlePromise(
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
  }, []);

  //sequence of events when data is updated (perform new filter based on search query)
  useEffect(() => {
    searchOnFilteredList(
      searchRef.current.value,
      researcherCollections,
      filterFn,
      setFilteredList
    );
  }, [researcherCollections]);

  //review collection function, passed to collections table to be used in buttons
  const redirectToDARApplication = (darCollection) => {
    try {
      const { darCollectionId } = darCollection;
      history.push(`/dar_application_review/${darCollectionId}`);
    } catch (error) {
      Notifications.showError({
        text: 'Error: Cannot view target Data Access Request'
      });
    }
  };

  const resumeDARApplication = (darCollection) => {
    const referenceId = darCollection.referenceId || flow(get('dars'), keys, head)(darCollection);
    history.push(`/dar_application/${referenceId}`);
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
    div({ style: { display: 'flex', justifyContent: 'space-between', margin: '0px -3%' } }, [
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
              [`Select and manage DAR Collections and Drafts below`]
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
        reviewCollection: redirectToDARApplication,
        resumeCollection: resumeDARApplication,
        deleteDraft,
        consoleType: 'researcher',
      })
    ]),
  ]);
}