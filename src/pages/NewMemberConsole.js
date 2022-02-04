import React, {useEffect, useMemo, useState} from 'react';
import {div, img, span} from 'react-hyperscript-helpers';
import {Collections} from '../libs/ajax';
import {Notifications, USER_ROLES, processElectionStatus} from '../libs/utils';
import {Styles} from '../libs/theme';
import lockIcon from '../images/lock-icon.png';
import {useTable} from 'react-table';
import ChevronRight from 'react-material-icon-svg/dist/ChevronRight';
import {flatMap, filter, getOr, head, indexOf, isEmpty, map, uniq, values} from 'lodash/fp';
import {Storage} from '../libs/storage';

const chevronRight = <ChevronRight fill={'#4D72AA'} style={{
  marginLeft: '1rem',
  verticalAlign: 'middle',
}}/>;

const baseStyles = {
  container: {
    marginTop: '2rem',
    borderTop: '1px solid #979797',
    backgroundColor: 'rgb(184,205,211,0.08)',
    padding: '2rem',
    width: '100%',
    color: '#7B7B7B',
    fontFamily: 'Montserrat',
  },
  headerRow: {
    display: 'flex',
    width: '100%',
  },
  headerCell: {
    textTransform: 'uppercase',
    fontSize: '12px',
    padding: '1rem',
  },
  bodyRow: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #DEDEDE',
    width: '100%',
    display: 'flex',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  bodyCell: {
    padding: '1rem',
    marginTop: '.5rem',
  },
};

const buildTable = (tableInstance) => {
  return div({}, [
    buildHeaderRow(tableInstance),
    buildDataRows(tableInstance),
  ]);
};

const buildHeaderRow = (tableInstance) => {
  const {headerGroups} = tableInstance;
  return div({}, [
    headerGroups.map(headerGroup =>
      div(
        {style: baseStyles.headerRow, ...headerGroup.getHeaderGroupProps()},
        [
          headerGroup.headers.map(column =>
            div({style: Object.assign({}, baseStyles.headerCell, {width: column.width}), ...column.getHeaderProps()},
              [column.render('Header')])),
        ])
    )
  ]);
};

const buildDataRows = (tableInstance) => {
  const {
    columns,
    getTableBodyProps,
    rows,
    prepareRow,
  } = tableInstance;
  return div({...getTableBodyProps()}, [
    rows.map(row => {
      prepareRow(row);
      return (div({style: baseStyles.bodyRow, ...row.getRowProps()}, [
        row.cells.map((cell, index) => {
          const column = columns[index];
          const style = Object.assign({}, baseStyles.bodyCell, {width: column.width});
          return (div({style: style, ...cell.getCellProps()},
            [cell.render('Cell')]));
        }),
      ]));
    }),
  ]);
};

// This method will filter available elections by the user and display an
// accurate status for all elections that exist for the collection.
const processCollectionElectionStatus = (collection, user) => {
  const {dars} = collection;
  // 'dars' is a map of referenceId -> full DAR object
  const darValues = values(dars);
  // 'elections' is a map of election id -> full Election object
  const electionMaps = map('elections')(darValues);
  const electionValues = flatMap((e) => { return values(e); })(electionMaps);
  // Filter elections for my DACs by looking for elections with votes that have my user id
  const filteredElections = filter(e => {
    // Votes is a map of vote id -> full Vote object
    const voteMap = getOr([], 'votes')(e);
    const voteUserIds = map('dacUserId')(values(voteMap));
    // If there is a vote for this user, then this is a valid election
    return indexOf(user.dacUserId)(voteUserIds) >= 0;
  })(electionValues);
  // find all statuses that exist for all the user's elections
  const statuses = uniq(filteredElections.map(e => processElectionStatus(e, e.votes, false)));
  if (isEmpty(statuses)) {
    return 'Unreviewed';
  }
  return statuses.join(", ");
};

// TODO: Flesh this out
const processActionButtons = (collection) => {
  return 'Vote';
};

const processRowData = (collections, user) => {
  return collections.map(collection => {
    const {dars, darCode, datasets, createUser} = collection;
    const title = getOr('--', 'data.projectTitle')(head(values(dars)));
    const institution = getOr('', 'institution.name')(createUser);
    const status = processCollectionElectionStatus(collection, user);
    const actions = processActionButtons(collection);
    return {
      col0: span({style: {}}, [chevronRight]),
      col1: span({style: {fontSize: '16px'}}, [darCode]),
      col2: span({style: {}}, [title]),
      col3: span({style: {}}, ['--']),
      col4: span({style: {}}, [institution]),
      col5: span({style: {fontSize: '16px'}}, [datasets.length]),
      col6: span({style: {}}, [status]),
      col7: span({style: {}}, [actions]),
    };
  });
};

export default function NewMemberConsole() {

  const [isLoaded, setIsLoaded] = useState(false);
  const [collections, setCollections] = useState([]);
  const user = Storage.getCurrentUser();
  const columns = useMemo(
    () => [
      {
        Header: '',
        accessor: 'col0', // accessor is the "key" in the data
        width: '5%',
      },
      {
        Header: 'DAR ID',
        accessor: 'col1',
        width: '10%',
      },
      {
        Header: 'Title',
        accessor: 'col2',
        width: '20%',
      },
      {
        Header: 'PI',
        accessor: 'col3',
        width: '10%',
      },
      {
        Header: 'Institution',
        accessor: 'col4',
        width: '25%',
      },
      {
        Header: 'Datasets',
        accessor: 'col5',
        width: '10%',
      },
      {
        Header: 'Status',
        accessor: 'col6',
        width: '10%',
      },
      {
        Header: 'Action',
        accessor: 'col7',
        width: '10%',
      },
    ],
    [],
  );
  const data = useMemo(() => processRowData(collections, user), [collections, user]);
  const tableInstance = useTable({columns, data});

  useEffect(() => {
    const init = async () => {
      try {
        const collections = await Collections.getCollectionsByRoleName(
          USER_ROLES.member);
        setCollections(collections);
        setIsLoaded(true);
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
      ]),
      div({
        isRendered: isLoaded,
        style: baseStyles.container,
      },
      [buildTable(tableInstance)]),
    ])
  );
}
