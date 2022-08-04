import { useState, useEffect, Fragment, useCallback } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { isEmpty } from 'lodash/fp';
import { Styles, Theme } from '../../libs/theme';
import PaginationBar from '../PaginationBar';
import SimpleButton from '../SimpleButton';
import ConfirmationModal from '../modals/ConfirmationModal';
import {
  formatDate,
  recalculateVisibleTable,
  goToPage as updatePage
} from '../../libs/utils';
import SimpleTable from '../SimpleTable';

const styles = {
  baseStyle: {
    fontFamily: 'Arial',
    fontSize: '1.6rem',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
    justifyContent: 'space-between',
  }),
  cellWidth: {
    partialDarCode: '15%',
    projectTitle: '30%',
    updateDate: '15%',
    actions: '25%',
  },
};

//data struct to outline column widths and header labels
const columnHeaderFormat = {
  partialDarCode: {label: 'Partial DAR Code', cellStyle: { width: styles.cellWidth.partialDarCode}},
  projectTitle: {label: 'Title', cellStyle: { width: styles.cellWidth.projectTitle}},
  updateDate: {label: 'Last Updated', cellStyle: {width: styles.cellWidth.updateDate}},
  actions: {label: 'DAR Actions', cellStyle: { width: styles.cellWidth.actions}}
};

//basic helper function to format above keys in fixed order array
const columnHeaderData = () => {
  const { partialDarCode, projectTitle, updateDate, actions } = columnHeaderFormat;
  return [partialDarCode, projectTitle, updateDate, actions];
};

//helper function to create table metadata for dar code cell data format
const partialDarCodeCell = ({partialDarCode = '- -', id, style = {}, label = 'partial-dar-code'}) => {
  return {
    data: partialDarCode,
    id,
    style,
    label
  };
};

//helper function to create table metadata for projectTitle cell data format
const projectTitleCell = ({projectTitle = '- -', id, style = {}, label = 'draft-project-title' }) => {
  return {
    data: projectTitle,
    id,
    style,
    label
  };
};

//helper function to create table metadata for update date cell metadata
const updateDateCell = ({updateDate, id, style = {}, label = 'draft-update-date'}) => {
  return {
    data: formatDate(updateDate),
    id,
    style,
    label
  };
};

//sub-component that redirects user to draft applictaion page
const ResumeDraftButton = (props) => {
  const { draft, history } = props;
  const { referenceId } = draft;
  return h(SimpleButton, {
    keyProp: `resume-draft-${referenceId}`,
    label: 'Resume',
    baseColor: Theme.palette.secondary,
    additionalStyle: {
      width: '30%',
      padding: '2%',
      marginRight: '2%',
      fontSize: '1.45rem'
    },
    onClick: () => history.push(`/dar_application/${referenceId}`)
  });
};

//helper function to create id string for error messages
const getIdentifier = ({id, data}) => {
  return !isEmpty(data) ? (data.projectTitle || data.partialDarCode) : id;
};

//sub-component that renders draft delete button
const DeleteDraftButton = (props) => {
  const { targetDraft, showConfirmationModal } = props;
  const { id, data } = targetDraft;
  const identifier = getIdentifier({id, data});
  return h(SimpleButton, {
    keyProp: `delete-draft-${identifier}`,
    label: 'Delete',
    baseColor: Theme.palette.error,
    additionalStyle: {
      width: '30%',
      padding: '2%',
      fontSize: '1.45rem',
    },
    onClick: () => showConfirmationModal(targetDraft),
  });
};

//helper function that formats table metadata and components for draft action buttons
const actionCellData = ({
  targetDraft,
  showConfirmationModal,
  history,
}) => {
  const { id } = targetDraft;
  const deleteButtonTemplate = h(DeleteDraftButton, {
    targetDraft,
    showConfirmationModal
  });
  const resumeButtonTemplate = h(ResumeDraftButton, {
    draft: targetDraft,
    history,
  });

  return {
    isComponent: true,
    label: 'draft-buttons',
    data: div(
      {
        style: {
          display: 'flex',
          justifyContent: 'left',
        },
        key: `draft-buttons-cell-${id}`,
      },
      [resumeButtonTemplate, deleteButtonTemplate]
    ),
  };
};

//helper function that foramts table metadata for cells row by row, returns an array of arrays
const processDraftsRowData = ({visibleDrafts, showConfirmationModal, history}) => {
  if(!isEmpty(visibleDrafts)) {
    return visibleDrafts.map((draft) => {
      const { id, data, createDate, updateDate } = draft;
      const { projectTitle } = !isEmpty(data) ? data : {};
      const partialDarCode = 'DRAFT_DAR_' + formatDate(createDate);
      return [
        partialDarCodeCell({partialDarCode, id}),
        projectTitleCell({projectTitle, id}),
        updateDateCell({updateDate: updateDate || createDate, id}),
        actionCellData({targetDraft: draft, showConfirmationModal, history})
      ];
    });
  }
};

export default function DarDraftTable(props) {
  const [visibleDrafts, setVisibleDrafts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [tableSize, setTableSize] = useState(10);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState({});

  const { history, deleteDraft, isLoading, drafts } = props;

  //sequence of events that fires when table either changes its visible window (data updates, page change, table size change, etc)
  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: drafts,
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleDrafts
    });
  }, [tableSize, pageCount, currentPage, drafts]);

  //callback function to change tableSize, passed to pagination bar
  const changeTableSize = useCallback((value) => {
    if (value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value);
    }
  }, []);

  //function that fires on delete button press, makes confirmation modal visible and selectes target draft
  const showConfirmationModal = (draft) => {
    setSelectedDraft(draft);
    setShowConfirmation(true);
  };

  //function that fires when user updates current page (buttons, manual input), passed to pagination bar
  const goToPage = useCallback(
    (value) => {
      updatePage(value, pageCount, setCurrentPage);
    },
    [pageCount]
  );

  //helper function that formats string for modal header
  const getModalHeader = () => {
    if(!isEmpty(selectedDraft)) {
      const { data, id } = selectedDraft;
      return getIdentifier({id, data});
    }
  };

  //delete function that fires on modal confirmation, removes draft from listing via prop delete function
  const deleteOnClick = async() => {
    const {id, data, referenceIds} = selectedDraft;
    const identifier = getIdentifier({id: id || referenceIds, data});
    await deleteDraft({ referenceIds, identifier, });
    setShowConfirmation(false);
  };

  return h(Fragment, {}, [
    h(SimpleTable, {
      isLoading,
      rowData: processDraftsRowData({visibleDrafts, showConfirmationModal, history}),
      columnHeaders: columnHeaderData(),
      styles,
      tableSize,
      paginationBar: h(PaginationBar, {
        pageCount,
        currentPage,
        tableSize,
        goToPage,
        changeTableSize
      })
    }),
    h(ConfirmationModal, {
      showConfirmation,
      closeConfirmation: () => setShowConfirmation(false),
      title: 'Delete Draft Data Access Request',
      message: `Are you sure you want to delete Data Access Request draft ${getIdentifier({id: selectedDraft.id, data: selectedDraft.data})}`,
      header: getModalHeader(),
      onConfirm: deleteOnClick
    })
  ]);
}
