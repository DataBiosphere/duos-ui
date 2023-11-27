import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cloneDeep, findIndex } from 'lodash/fp';
import { Styles } from '../../libs/theme';
import { Collections, DAR } from '../../libs/ajax';
import {
  DarCollectionTable,
  DarCollectionTableColumnOptions
} from '../../components/dar_collection_table/DarCollectionTable';
import accessIcon from '../../images/lock-icon.png';
import { getSearchFilterFunctions, Notifications, searchOnFilteredList, USER_ROLES } from '../../libs/utils';
import SearchBar from '../../components/SearchBar';
import { consoleTypes } from '../../components/dar_collection_table/DarCollectionTableCellData';
import BroadLibraryCardAgreementLink from '../../assets/Library_Card_Agreement_2023_ApplicationVersion.pdf';
import NhgriLibraryCardAgreementLink from '../../assets/NIH_Library_Card_Agreement_11_17_22_version.pdf';

const filterFn = getSearchFilterFunctions().darCollections;

export default function ResearcherConsole() {
  const [isLoading, setIsLoading] = useState(true);
  const [researcherCollections, setResearcherCollections] = useState();
  const [filteredList, setFilteredList] = useState();
  const searchRef = useRef('');

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
      const collections = await Collections.getCollectionSummariesByRoleName(USER_ROLES.researcher);
      setResearcherCollections(collections);
      setFilteredList(collections);
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

  //cancel collection function, passed to collections table to be used in buttons
  const cancelCollection = async (darCollection) => {
    try {
      const { darCollectionId, darCode } = darCollection;
      await Collections.cancelCollection(darCollectionId);
      const updatedCollection = await Collections.getCollectionSummaryByRoleNameAndId({
        roleName: USER_ROLES.researcher,
        id: darCollectionId
      });
      const targetIndex = researcherCollections.findIndex((collection) =>
        collection.darCollectionId === darCollectionId);
      if (targetIndex < 0) {
        throw new Error('Error: Could not find target Data Access Request');
      }
      const clonedCollections = cloneDeep(researcherCollections);
      clonedCollections[targetIndex] = updatedCollection;
      setResearcherCollections(clonedCollections);
      Notifications.showSuccess({ text: `Deleted Data Access Request ${darCode}` });
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
      clonedCollections[targetIndex] = draftCollection;
      setResearcherCollections(clonedCollections);
      Notifications.showSuccess({ text: `Revising Data Access Request ${darCode}` });
    } catch (error) {
      Notifications.showError({
        text: 'Error: Cannot revise target Data Access Request'
      });
    }
  };


  //Draft delete, by referenceIds
  const deleteDraftById = async ({ referenceId }) => {
    const collectionsClone = cloneDeep(researcherCollections);
    await DAR.deleteDar(referenceId);
    const targetIndex = findIndex((draft) => {
      return draft.referenceIds[0] === referenceId;
    })(collectionsClone);

    // if deleted index, remove it from the collections array
    collectionsClone.splice(targetIndex, 1);
    setResearcherCollections(collectionsClone);

    return targetIndex;
  };

  //Draft delete, passed down to draft table to be used with delete button
  const deleteDraft = async ({ referenceIds, darCode }) => {
    try {
      const targetIndex = deleteDraftById({ referenceId: referenceIds[0] });
      if (targetIndex === -1) {
        Notifications.showError({ text: 'Error processing delete request' });
      } else {
        Notifications.showSuccess({ text: `Deleted Data Access Request Draft ${darCode}` });
      }
    } catch (error) {
      Notifications.showError({
        text: `Failed to delete Data Access Request Draft ${darCode}`,
      });
    }

  };

  return (
    <div style={Styles.PAGE}>
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0px -3%' }}>
        <div className="left-header-section" style={Styles.LEFT_HEADER_SECTION}>
          <div style={Styles.ICON_CONTAINER}>
            <img id="access-icon" src={accessIcon} style={Styles.HEADER_IMG} />
          </div>
          <div style={Styles.HEADER_CONTAINER}>
            <div style={Styles.TITLE}>My Data Access Requests</div>
            <div style={Object.assign({}, Styles.MEDIUM_DESCRIPTION, { fontSize: '18px' })}>
              Select and manage Data Access Requests and Drafts below
            </div>
            <div style={Object.assign({}, Styles.MEDIUM_DESCRIPTION, { fontSize: '18px' })}>
              By submitting a DAR in DUOS you agree to the
              {' '}
              <a target="_blank" rel="noreferrer" href={BroadLibraryCardAgreementLink}>
                Broad
              </a>
              {' '}
              and
              {' '}
              <a target="_blank" rel="noreferrer" href={NhgriLibraryCardAgreementLink}>
                NHGRI
              </a>
              {' '}
              Library Card Agreements.
            </div>
          </div>
        </div>
        <SearchBar handleSearchChange={handleSearchChange} searchRef={searchRef} />
      </div>
      <div className="table-container">
        <DarCollectionTable
          collections={filteredList}
          columns={[
            DarCollectionTableColumnOptions.DAR_CODE,
            DarCollectionTableColumnOptions.NAME,
            DarCollectionTableColumnOptions.SUBMISSION_DATE,
            DarCollectionTableColumnOptions.DATASET_COUNT,
            DarCollectionTableColumnOptions.STATUS,
            DarCollectionTableColumnOptions.ACTIONS,
          ]}
          isLoading={isLoading}
          cancelCollection={cancelCollection}
          reviseCollection={reviseCollection}
          deleteDraft={deleteDraft}
          consoleType={consoleTypes.RESEARCHER}
        />
      </div>
    </div>
  );
}
