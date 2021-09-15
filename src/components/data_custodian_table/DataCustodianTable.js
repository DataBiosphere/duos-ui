import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { Styles, Theme } from "../../libs/theme";
import { h, div, img } from "react-hyperscript-helpers";
import userIcon from '../../images/icon_manage_users.png';
import { cloneDeep, find, findIndex, join, map, sortedUniq, sortBy, isEmpty, isNil, flow } from "lodash/fp";
import SimpleTable from "../SimpleTable";
import SimpleButton from "../SimpleButton";
import PaginationBar from "../PaginationBar";
import SearchBar from "../SearchBar";
import {
  Notifications,
  tableSearchHandler,
  recalculateVisibleTable,
  getSearchFilterFunctions,
  searchOnFilteredList
} from "../../libs/utils";
import LibraryCardFormModal from "../modals/LibraryCardFormModal";
import ConfirmationModal from "../modals/ConfirmationModal";

//NOTE: make sure the new 'custodian' model works 

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
  institution: {label: 'Institution', cellStyle: {width: styles.cellWidths.institution}}
};

const RemoveDataCustodianButton = (props) => {
  const { custodian = {}, showConfirmationModal } = props;
  const message = 'Are you sure you want to remove this data custodian?';
  const title = 'Remove Data Custodian';
  return h(SimpleButton, {
    keyProp: `remove-custodian-${custodian.id}`,
    label: 'Remove',
    baseColor: Theme.palette.error,
    additionalStyle: {
      width: '30%',
      padding: '2%',
      fontSize: '1.45rem',
    },
    onClick: () =>
      showConfirmationModal({ custodian, message, title, confirmType: 'delete' }),
  });
};

const IssueDataCustodianButton = (props) => {
  const { custodian, showConfirmationModal } = props;
  const message = 'Are you sure you want to make this persone a Data Custodian?';
  const title = 'Issue Data Custodian';
  return h(SimpleButton, {
    keyProp: `issue-card-${custodian.userEmail}`,
    label: 'Issue',
    baseColor: Theme.palette.secondary,
    additionalStyle: {
      width: '30%',
      padding: '2%',
      fontSize: '1.45rem',
    },
    onClick: () =>
      showConfirmationModal({ custodian, message, title, confirmType: 'issue' }),
  });
};

const researcherFilterFunction = getSearchFilterFunctions().signingOfficialResearchers;

const CustodianCell = ({
  custodian,
  showConfirmationModal,
  institutionId
}) => {
  const id = custodian.dacUserId || custodian.email;
  const button = !isNil(custodian)
    ? RemoveDataCustodianButton({
      custodian,
      showConfirmationModal,
    })
    : IssueDataCustodianButton({
      custodian: {
        userId: custodian.dacUserId,
        userEmail: custodian.email,
        institutionId: institutionId
      },
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
    data: displayName || '- -',
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
    custodian,
    message,
    title,
    confirmType,
  }) => {
    setSelectedResearcher(custodian);
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
          custodian: researcher,
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

  //NOTE: check to see if function works as expected
  const issueCustodian = async (selectedResearcher, researchers) => {
    let messageName;
    const {id, email, displayName} = selectedResearcher;
    try {
      const listCopy = cloneDeep(researchers);
      let targetIndex = findIndex(
        (researcher) => id === researcher.dacUserId
      )(listCopy);
      if (targetIndex === -1) {
        const targetUnregisteredResearcher = find(
          (researcher) => id === researcher.dacUserId
        )(props.unregisteredResearchers);
        if(!isNil(targetUnregisteredResearcher)) {
          Notifications.showError({
            text: `${targetUnregisteredResearcher.email || targetUnregisteredResearcher.displayName} is already a Data Custodian`
          });
        } else {
          listCopy.unshift(selectedResearcher);
          messageName = email;
        }
      } else {
        messageName = displayName;
      }
      setResearchers(listCopy);
      setShowConfirmation(false);
      setShowModal(false);
      Notifications.showSuccess({
        text: `Issued ${messageName} as Data Custodian`,
      });
    } catch (error) {
      Notifications.showError({
        text: `Error issuing ${messageName} as Data Custodian`,
      });
    }
  };

  const removeDataCustodian = async (selectedResearcher, researchers) => {
    const { id, displayName, email, userId } = selectedResearcher;
    const listCopy = cloneDeep(researchers);
    const messageName = displayName || email;
    try {
      const targetIndex = findIndex((researcher) => {
        return !isNil(researcher) && id === researcher.id;
      })(researchers);
      if (
        isNil(userId) ||
        researchers[targetIndex].institutionId !== signingOfficial.institutionId
      ) {
        listCopy.splice(targetIndex, 1);
      }
      setResearchers(listCopy);
      setShowConfirmation(false);
      Notifications.showSuccess({
        text: `Removed ${messageName} as a Data Custodian`,
      });
    } catch (error) {
      Notifications.showError({
        text: `Error removing ${messageName} as a Data Custodian`,
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
              'Researchers',
            ]),
            div(
              {
                style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {
                  fontSize: '16px',
                }),
              },
              [
                "My Institution's Researchers. Issue or Remove Researcher privileges below.",
              ]
            ),
          ]),
        ]),
        h(SearchBar, { handleSearchChange, searchRef }),
        div({ style: {} }, [
          h(SimpleButton, {
            onClick: () => showModalOnClick(),
            baseColor: Theme.palette.secondary,
            label: 'Add New Researcher',
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
    //NOTE: need to make a new modal? Or genericize the already existing modal
    // h(LibraryCardFormModal, {
    //   showModal,
    //   createOnClick: (researcher) => issueCustodian(researcher, researchers),
    //   closeModal: () => setShowModal(false),
    //   researcher: selectedResearcher,
    //   users: unregisteredResearchers,
    //   institutions: [], //pass in empty array to force modal to hide institution dropdown
    //   modalType: 'add',
    // }),
    h(ConfirmationModal, {
      showConfirmation,
      closeConfirmation: () => setShowConfirmation(false),
      title: confirmationTitle,
      message: confirmationModalMsg,
      header: `${selectedResearcher.userName || selectedResearcher.userEmail} - ${
        !isNil(selectedResearcher.institution) ? selectedResearcher.institution.name : ''
      }`,
      onConfirm: () =>
        confirmType == 'delete'
          ? removeDataCustodian(selectedResearcher, researchers)
          : issueCustodian(selectedResearcher, researchers),
    }),
  ]);
}