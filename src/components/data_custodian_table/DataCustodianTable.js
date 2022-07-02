import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { Styles, Theme } from '../../libs/theme';
import { h, div, img } from 'react-hyperscript-helpers';
import userIcon from '../../images/icon_manage_users.png';
import { cloneDeep, find, findIndex, join, map, sortedUniq, sortBy, isNil, flow } from 'lodash/fp';
import SimpleTable from '../SimpleTable';
import SimpleButton from '../SimpleButton';
import PaginationBar from '../PaginationBar';
import SearchBar from '../SearchBar';
import {
  Notifications,
  tableSearchHandler,
  recalculateVisibleTable,
  getSearchFilterFunctions,
  searchOnFilteredList
} from '../../libs/utils';
import ConfirmationModal from '../modals/ConfirmationModal';
import DataCustodianFormModal from '../modals/DataCustodianFormModal';

//Styles specific to this table
const styles = {
  baseStyle: {
    fontFamily: 'Arial',
    fontSize: '14px',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
    justifyContent: 'space-between',
  }),
  cellWidths: {
    email: '25%',
    name: '20%',
    libraryCard: '25%',
    institution: '20%',
    // activeDARs: '10%'
  },
};

//column header format for table
const columnHeaderFormat = {
  email: {label: 'Email', cellStyle: {width: styles.cellWidths.email}},
  name: {label: 'Name', cellStyle: {width: styles.cellWidths.name}},
  role: {label: 'Role', cellStyle: {width: styles.cellWidths.libraryCard}},
  institution: {label: 'Submitter Status', cellStyle: {width: styles.cellWidths.institution}}
};

const RemoveDataCustodianButton = (props) => {
  const { researcher = {}, showConfirmationModal } = props;
  const message = 'Are you sure you want to remove this Data Submitter?';
  const title = 'Remove Data Submitter';
  return h(SimpleButton, {
    keyProp: `remove-custodian-${researcher.id}`,
    label: 'Remove',
    baseColor: Theme.palette.error,
    additionalStyle: {
      width: '30%',
      padding: '2%',
      fontSize: '1.45rem',
    },
    onClick: () =>
      showConfirmationModal({ researcher, message, title, confirmType: 'delete' }),
  });
};

const IssueDataCustodianButton = (props) => {
  const { researcher, showConfirmationModal } = props;
  const message = 'Are you sure you want to make this person a Data Submitter?';
  const title = 'Issue Data Submitter';
  return h(SimpleButton, {
    keyProp: `issue-card-${researcher.userEmail}`,
    label: 'Issue',
    baseColor: Theme.palette.secondary,
    additionalStyle: {
      width: '30%',
      padding: '2%',
      fontSize: '1.45rem',
    },
    onClick: () =>
      showConfirmationModal({ researcher, message, title, confirmType: 'issue' }),
  });
};

const researcherFilterFunction = getSearchFilterFunctions().signingOfficialResearchers;

const CustodianCell = ({
  researcher,
  showConfirmationModal
}) => {
  const id = researcher.userId || researcher.email;
  const button = researcher.isCustodian
    ? RemoveDataCustodianButton({
      researcher,
      showConfirmationModal,
    })
    : IssueDataCustodianButton({
      researcher,
      showConfirmationModal
    });
  return {
    isComponent: true,
    id,
    label: 'lc-button',
    data: div(
      {
        style: {
          display: 'flex',
          justifyContent: 'left',
        },
        key: `lc-action-cell-${id}`,
      },
      [button]
    ),
  };
};

const roleCell = (roles, id) => {
  const roleString = flow(
    map((role) => role.name),
    sortBy((name) => name),
    sortedUniq,
    join(', ')
  )(roles);

  return {
    data: roleString || '- -',
    id,
    style: {},
    label: 'user-role',
  };
};

const emailCell = (email, id) => {
  return {
    data: email || '- -',
    id,
    style: {},
    label: 'user-email',
  };
};

const displayNameCell = (displayName, id) => {
  return {
    data: displayName || 'Invite sent, pending registration',
    id,
    style: {},
    label: 'display-name',
  };
};


export default function DataCustodianTable(props) {
  const [researchers, setResearchers] = useState(props.researchers || []);
  const [tableSize, setTableSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [filteredResearchers, setFilteredResearchers] = useState([]);
  const [visibleResearchers, setVisibleResearchers] = useState([]);
  const [selectedResearcher, setSelectedResearcher] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const searchRef = useRef('');
  const [confirmationModalMsg, setConfirmationModalMsg] = useState('');
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const [confirmType, setConfirmType] = useState('delete');
  const { signingOfficial, unregisteredResearchers, isLoading } = props;

  const handleSearchChange = tableSearchHandler(
    researchers,
    setFilteredResearchers,
    setCurrentPage,
    'signingOfficialResearchers'
  );

  const showConfirmationModal = ({
    researcher,
    message,
    title,
    confirmType,
  }) => {
    setSelectedResearcher(researcher);
    setShowConfirmation(true);
    setConfirmationModalMsg(message);
    setConfirmationTitle(title);
    setConfirmType(confirmType);
  };

  //init hook, need to make ajax calls here
  useEffect(() => {
    const init = async () => {
      try {
        setResearchers(props.researchers);
      } catch (error) {
        Notifications.showError({
          text: 'Failed to initialize researcher table',
        });
      }
    };
    init();
  }, [props.researchers]);

  useEffect(() => {
    searchOnFilteredList(
      searchRef.current.value,
      researchers,
      researcherFilterFunction,
      setFilteredResearchers
    );
  }, [researchers]);

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: filteredResearchers,
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleResearchers,
    });
  }, [tableSize, pageCount, filteredResearchers, currentPage]);

  const goToPage = useCallback(
    (value) => {
      if (value >= 1 && value <= pageCount) {
        setCurrentPage(value);
      }
    },
    [pageCount]
  );

  const changeTableSize = useCallback((value) => {
    if (value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value);
    }
  }, []);

  const paginationBar = h(PaginationBar, {
    pageCount,
    currentPage,
    tableSize,
    goToPage,
    changeTableSize,
  });

  const processResearcherRowData = (researchers = []) => {
    return researchers.map((researcher) => {
      const {displayName, email, id, roles} = researcher;
      return [
        displayNameCell(displayName, id),
        emailCell(email, id),
        CustodianCell({
          researcher,
          showConfirmationModal,
          institutionId: signingOfficial.institutionId,
        }),
        roleCell(roles, id),
        // activeDarCountCell(count, id)
      ];
    });
  };

  const columnHeaderData = [
    columnHeaderFormat.name,
    columnHeaderFormat.email,
    columnHeaderFormat.institution,
    columnHeaderFormat.role,
    // columnHeaderFormat.activeDARs -> add this back in when back-end supports this
  ];

  const showModalOnClick = () => {
    setSelectedResearcher({ institutionId: signingOfficial.institutionId });
    setShowModal(true);
  };

  const issueCustodian = async (selectedResearcher, researchers) => {
    let messageName;
    const {userId: userId, displayName} = selectedResearcher;
    try {
      const listCopy = cloneDeep(researchers);
      let targetIndex = findIndex(
        (researcher) => userId === researcher.userId
      )(listCopy);
      if (targetIndex === -1) {
        const targetResearcher = find(
          (researcher) => userId === researcher.userId
        )(props.unregisteredResearchers) || selectedResearcher;
        targetResearcher.isCustodian = true;
        listCopy.unshift(targetResearcher);
        messageName = targetResearcher.email;
      } else {
        listCopy[targetIndex].isCustodian = true;
        messageName = displayName;
      }

      setResearchers(listCopy);
      setShowConfirmation(false);
      setShowModal(false);
      Notifications.showSuccess({
        text: `Issued ${messageName} as Data Submitter`,
      });
    } catch (error) {
      Notifications.showError({
        text: `Error issuing ${messageName} as Data Submitter`,
      });
    }
  };

  const removeDataCustodian = async (selectedResearcher, researchers) => {
    const { displayName, email, userId: userId } = selectedResearcher;
    const searchableKey = !isNil(userId) ? 'dacUserId' : 'email';
    const listCopy = cloneDeep(researchers);
    const messageName = displayName || email;
    try {
      const targetIndex = findIndex((researcher) => {
        return !isNil(researcher) && selectedResearcher[searchableKey] === researcher[searchableKey];
      })(listCopy);
      if (
        isNil(userId) ||
        researchers[targetIndex].institutionId !== signingOfficial.institutionId
      ) {
        listCopy.splice(targetIndex, 1);
      } else {
        listCopy[targetIndex].isCustodian = false;
      }
      setResearchers(listCopy);
      setShowConfirmation(false);
      Notifications.showSuccess({
        text: `Removed ${messageName} as a Data Submitter`,
      });
    } catch (error) {
      Notifications.showError({
        text: `Error removing ${messageName} as a Data Submitter`,
      });
    }
  };

  return h(Fragment, {}, [
    div(
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        },
      },
      [
        div({ style: Styles.LEFT_HEADER_SECTION }, [
          div({ style: { ...Styles.ICON_CONTAINER, textAlign: 'center' } }, [
            img({
              id: 'user-icon',
              src: userIcon,
            }),
          ]),
          div({ style: Styles.HEADER_CONTAINER }, [
            div({ style: { ...Styles.SUB_HEADER, marginTop: '0' } }, [
              'Data Submitters',
            ]),
            div(
              {
                style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {
                  fontSize: '16px',
                }),
              },
              [
                'Your Institution\'s Data Submitters. Issue or remove Data Submitter privileges below.',
              ]
            ),
          ]),
        ]),
        h(SearchBar, { handleSearchChange, searchRef }),
        div({ style: {} }, [
          h(SimpleButton, {
            onClick: () => showModalOnClick(),
            baseColor: Theme.palette.secondary,
            label: 'Add New Data Submitter',
            additionalStyle: {
              width: '20rem',
            },
          }),
        ]),
      ]
    ),
    h(SimpleTable, {
      isLoading,
      rowData: processResearcherRowData(visibleResearchers),
      columnHeaders: columnHeaderData,
      styles,
      tableSize,
      paginationBar,
    }),
    h(DataCustodianFormModal, {
      showModal,
      createOnClick: (researcher) => issueCustodian(researcher, researchers),
      closeModal: () => setShowModal(false),
      researcher: selectedResearcher,
      users: unregisteredResearchers
    }),
    h(ConfirmationModal, {
      showConfirmation,
      closeConfirmation: () => setShowConfirmation(false),
      title: confirmationTitle,
      message: confirmationModalMsg,
      header: `${selectedResearcher.displayName || selectedResearcher.email} - ${
        !isNil(selectedResearcher.institution) ? selectedResearcher.institution.name : ''
      }`,
      onConfirm: () =>
        confirmType == 'delete'
          ? removeDataCustodian(selectedResearcher, researchers)
          : issueCustodian(selectedResearcher, researchers),
    }),
  ]);
}