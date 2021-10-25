import { useState, useEffect, Fragment, useCallback } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { isNil, isEmpty, includes } from 'lodash/fp';
import { Styles, Theme } from '../../libs/theme';
import PaginationBar from '../PaginationBar';
import SimpleButton from '../SimpleButton';
import ConfirmationModal from '../modals/ConfirmationModal';
import {
  formatDate,
  recalculateVisibleTable,
  goToPage as updatePage,
  // darCollectionUtils,
} from '../../libs/utils';
import SimpleTable from '../SimpleTable';

const styles = {
  baseStyle: {
    fontFamily: 'Arial',
    fontSize: '14px',
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
  proejctTitle: {label: 'Project Title', cellStyle: { width: styles.cellWidth.projectTitle}},
  updateDate: {label: 'Last Updated', cellStyle: {width: styles.cellWidth.lastUpdated}},
  actions: {label: 'DAR Actions', cellStyle: { width: styles.cellWidth.actions}}
};

const columnHeaderData = () => {
  const { partialDarCode, projectTitle, updateDate, actions } = columnHeaderFormat;
  return [partialDarCode, projectTitle, updateDate, actions];
};

const partialDarCodeCell = ({partialDarCode = '- -', draftId, style = {}, label = 'partial-dar-code'}) => {
  return {
    data: partialDarCode,
    id: draftId,
    style,
    label
  };
};

const projectTitleCell = ({projectTitle = '- -', draftId, style = {}, label = 'draft-project-title' }) => {
  return {
    data: projectTitle,
    id: draftId,
    style,
    label
  };
};

const updateDateCell = ({updateDate, draftId, style = {}, label = 'draft-update-date'}) => {
  return {
    data: updateDate,
    id: draftId,
    style,
    label
  };
};

const ResumeButton = (props) => {
  const { draft, history } = props;
  const { referenceId } = draft;
  return h(SimpleButton, {
    keyProp: `resume-draft-${referenceId}`, //NOTE: make sure this works
    label: 'Resume',
    baseColor: Theme.palette.primary,
    additionalStyle: {
      width: '30%',
      padding: '2%',
      fontSize: '1.45rem'
    },
    onClick: () => history.push(`/dar_application/${referenceId}`)
  });
};

// const actionsCellData = (draft, showConfirmationModal)

export default function DarDraftTable(props) {
  const [visibleDrafts, setVisibleDrafts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [tableSize, setTableSize] = useState(10);
  const [showConfirmation, setShowConfirmation] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState({});

  const { history } = props;
}
