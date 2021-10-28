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

const columnHeaderFormat = {
  partialDarCode: {label: 'Partial DAR Code', cellStyle: { width: styles.cellWidth.partialDarCode}},
  projectTitle: {label: 'Project Title', cellStyle: { width: styles.cellWidth.projectTitle}},
  updateDate: {label: 'Last Updated', cellStyle: {width: styles.cellWidth.updateDate}},
  actions: {label: 'DAR Actions', cellStyle: { width: styles.cellWidth.actions}}
};

const columnHeaderData = () => {
  const { partialDarCode, projectTitle, updateDate, actions } = columnHeaderFormat;
  return [partialDarCode, projectTitle, updateDate, actions];
};

const partialDarCodeCell = ({partialDarCode = '- -', id, style = {}, label = 'partial-dar-code'}) => {
  return {
    data: partialDarCode,
    id,
    style,
    label
  };
};

const projectTitleCell = ({projectTitle = '- -', id, style = {}, label = 'draft-project-title' }) => {
  return {
    data: projectTitle,
    id,
    style,
    label
  };
};

const updateDateCell = ({updateDate, id, style = {}, label = 'draft-update-date'}) => {
  return {
    data: formatDate(updateDate),
    id,
    style,
    label
  };
};

const ResumeDraftButton = (props) => {
  const { draft, history } = props;
  const { referenceId } = draft;
  return h(SimpleButton, {
    keyProp: `resume-draft-${referenceId}`, //NOTE: make sure this works
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

const getIdentifier = ({id, data}) => {
  return !isEmpty(data) ? (data.projectTitle || data.tempDarCode) : id;
};

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

  //NOTE: make sure the buttons render correctly
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

const processDraftsRowData = ({visibleDrafts, showConfirmationModal, history}) => {
  if(!isEmpty(visibleDrafts)) {
    return visibleDrafts.map((draft) => {
      const { id, data, createDate, updateDate } = draft;
      const { projectTitle, partialDarCode } = !isEmpty(data) ? data : {};
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

  const changeTableSize = useCallback((value) => {
    if (value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value);
    }
  }, []);

  const showConfirmationModal = (draft) => {
    setSelectedDraft(draft);
    setShowConfirmation(true);
  };

  const goToPage = useCallback(
    (value) => {
      updatePage(value, pageCount, setCurrentPage);
    },
    [pageCount]
  );

  const getModalHeader = () => {
    if(!isEmpty(selectedDraft)) {
      const { data, id } = selectedDraft;
      return getIdentifier({id, data});
    }
  };

  const deleteOnClick = async() => {
    const {id, data, referenceId} = selectedDraft;
    const identifier = getIdentifier({id: id || referenceId, data});
    await deleteDraft({ referenceId, identifier, });
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
      styleOverrise: { height: '35%' },
      closeConfirmation: () => setShowConfirmation(false),
      title: 'Delete Draft DAR',
      message: `Are you sure you want to delete DAR draft ${getIdentifier({id: selectedDraft.id, data: selectedDraft.data})}`,
      header: getModalHeader(),
      onConfirm: deleteOnClick
    })
  ]);
}
