import {useEffect, useState} from 'react';
import {div, h, img, span} from 'react-hyperscript-helpers';
import {Collections} from '../libs/ajax';
import SearchBar from '../components/SearchBar';
import {Notifications, USER_ROLES} from '../libs/utils';
import {Styles} from '../libs/theme';
import lockIcon from '../images/lock-icon.png';
import DarTableSkeletonLoader from '../components/TableSkeletonLoader';
import {assign} from 'lodash/fp';
import DarCollectionTable
  from '../components/dar_collection_table/DarCollectionTable';

// This, the base style, and tableRowLoadingTemplate all apply to the skeleton loader.
const tableHeaderTemplate = () => {
  return [
    div({style: Styles.TABLE.DATA_ID_CELL, className: 'cell-sort'}, [
      'DAR Code',
      span({className: 'glyphicon sort-icon glyphicon-sort'})]),
    div({style: Styles.TABLE.TITLE_CELL, className: 'cell-sort'}, [
      'Project Title',
      span({className: 'glyphicon sort-icon glyphicon-sort'})]),
    div({style: Styles.TABLE.DATASET_CELL, className: 'cell-sort'}, [
      'Submission Date',
      span({className: 'glyphicon sort-icon glyphicon-sort'})]),
    div({style: Styles.TABLE.SUBMISSION_DATE_CELL, className: 'cell-sort'}, [
      'PI',
      span({className: 'glyphicon sort-icon glyphicon-sort'})]),
    div({style: Styles.TABLE.DAC_CELL, className: 'cell-sort'}, [
      'Institution',
      span({className: 'glyphicon sort-icon glyphicon-sort'})]),
    div({style: Styles.TABLE.ELECTION_STATUS_CELL, className: 'cell-sort'}, [
      'Datasets',
      span({className: 'glyphicon sort-icon glyphicon-sort'})]),
    div({style: Styles.TABLE.ELECTION_ACTIONS_CELL}, [
      'Status',
      span({className: 'glyphicon sort-icon glyphicon-sort'})]),
    div({style: Styles.TABLE.ELECTION_ACTIONS_CELL}, ['Action']),
  ];
};

const baseStyle = {
  margin: '1rem 2%',
  display: 'flex',
  justifyContent: 'left',
  alignItems: 'center',
};

const tableRowLoadingTemplate = () => {
  return [
    div({
      style: assign(baseStyle, {width: '12%'}),
      className: 'text-placeholder',
    }),
    div({
      style: assign(baseStyle, {width: '16%'}),
      className: 'text-placeholder',
    }),
    div({
      style: assign(baseStyle, {width: '12%'}),
      className: 'text-placeholder',
    }),
    div({
      style: assign(baseStyle, {width: '12%'}),
      className: 'text-placeholder',
    }),
    div({
      style: assign(baseStyle, {width: '12%'}),
      className: 'text-placeholder',
    }),
    div({
      style: assign(baseStyle, {width: '12%'}),
      className: 'text-placeholder',
    }),
    div({
      style: assign(baseStyle, {width: '12%'}),
      className: 'text-placeholder',
    }),
    div(
      {style: assign(baseStyle, {width: '12%'}), className: 'text-placeholder'}),
  ];
};

const handleSearchChange = () => {
};

export default function NewMemberConsole(props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [collections, setCollections] = useState([]);
  const [filteredCollections, setFilteredCollections] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const pendingCollections = await Collections.getCollectionsByRoleName(
          USER_ROLES.member);
        setCollections(pendingCollections);
        setFilteredCollections(pendingCollections);
        setIsLoading(false);
      } catch (error) {
        Notifications.showError(
          {text: 'Error: Unable to retrieve data access requests from server'});
      }
    };
    init();
  }, []);

  return (
    div({style: Styles.PAGE}, [
      div({style: {display: 'flex', justifyContent: 'space-between'}}, [
        div(
          {className: 'left-header-section', style: Styles.LEFT_HEADER_SECTION},
          [
            div({style: Styles.ICON_CONTAINER}, [
              img({
                id: 'lock-icon',
                src: lockIcon,
                style: Styles.HEADER_IMG,
              }),
            ]),
            div({style: Styles.HEADER_CONTAINER}, [
              div({style: Styles.TITLE}, ['DAC Member Console']),
              div({
                style: Object.assign({}, Styles.MEDIUM_DESCRIPTION,
                  {fontSize: '18px'}),
              }, ['Select and manage Data Access Requests for DAC review']),
            ]),
          ]),
        h(SearchBar, {handleSearchChange, currentPage}),
      ]),
      h(DarCollectionTable, {
        isRendered: !isLoading,
        collections: filteredCollections,
        isLoading,
        cancelCollection: undefined,
        resubmitCollection: undefined,
      }),
      h(DarTableSkeletonLoader, {
        isRendered: isLoading,
        tableHeaderTemplate: tableHeaderTemplate(),
        tableRowLoadingTemplate: tableRowLoadingTemplate(),
      }),
    ])
  );
}
