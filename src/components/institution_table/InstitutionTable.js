import { isEmpty, isNil, assign } from 'lodash/fp';
import { useState, useEffect } from 'react';
import { div, h, a , span } from 'react-hyperscript-helpers';
import { Styles } from '../../libs/theme';
import ReactTooltip from 'react-tooltip';
import PaginationBar from '../PaginationBar';
import AddInstitutionModal from '../modals/AddInstitutionModal';

export const tableHeaderTemplate = [
  div({style: Styles.TABLE.ID_CELL}, ['ID']),
  div({style: Styles.TABLE.INSTITUTION_CELL}, ['Institution']),
  div({style: Styles.TABLE.INSTITUTION_CELL}, ['Signing Officials']),
  div({style: Styles.TABLE.DATA_ID_CELL}, ['Create User']),
  div({style: Styles.TABLE.SUBMISSION_DATE_CELL}, ['Create Date']),
  div({style: Styles.TABLE.DATA_ID_CELL}, ['Update User']),
  div({style: Styles.TABLE.SUBMISSION_DATE_CELL}, ['Update Date']),
];

const loadingMarginOverwrite = {margin: '1rem 2%'};

export const tableRowLoadingTemplate = [
  div({style: assign(Styles.TABLE.ID_CELL, loadingMarginOverwrite), className: 'text-placeholder'}),
  div({style: assign(Styles.TABLE.INSTITUTION_CELL, loadingMarginOverwrite), className: 'text-placeholder'}),
  div({style: assign(Styles.TABLE.INSTITUTION_CELL, loadingMarginOverwrite), className: 'text-placeholder'}),
  div({style: assign(Styles.TABLE.DATA_ID_CELL, loadingMarginOverwrite), className: 'text-placeholder'}),
  div({style: assign(Styles.TABLE.SUBMISSION_DATE_CELL, loadingMarginOverwrite), className: 'text-placeholder'}),
  div({style: assign(Styles.TABLE.DATA_ID_CELL, loadingMarginOverwrite), className: 'text-placeholder'}),
  div({style: assign(Styles.TABLE.SUBMISSION_DATE_CELL, loadingMarginOverwrite), className: 'text-placeholder'})
];

const calcPageCount = (tableSize, filteredList) => {
  if(isEmpty(filteredList)) {
    return 1;
  }
  return Math.ceil(filteredList.length / tableSize);
};

export default function InstitutionTable(props) {
  const { filteredList, currentPage, setCurrentPage, tableSize, setTableSize, onUpdateSave } = props;
  const [pageCount, setPageCount] = useState(calcPageCount(tableSize, filteredList));
  const [showUpdateInstitutionModal, setShowUpdateInstitutionModal] = useState(false);
  const [institutionId, setInstitutionId] = useState();

  useEffect(() => {
    setPageCount(calcPageCount(tableSize, filteredList));

    ReactTooltip.rebuild();
  }, [currentPage, tableSize, filteredList]);

  const changeTableSize = (newTableSize) => {
    if(!isEmpty(newTableSize) && newTableSize > 0) {
      setTableSize(newTableSize);
    }
  };

  const goToPage = (currentPage) => {
    if(currentPage > 0 && currentPage < pageCount + 1) {
      setCurrentPage(currentPage);
    }
  };

  const openUpdateModal = (id) => {
    setInstitutionId(id);
    setShowUpdateInstitutionModal(true);
  };

  const closeUpdateModal = () => {
    setShowUpdateInstitutionModal(false);
    setInstitutionId(undefined);
  };

  return (
    div({className: 'institution-table-component'}, [
      div({style: Styles.TABLE.CONTAINER}, [
        div({style: Styles.TABLE.HEADER_ROW}, tableHeaderTemplate),
        filteredList.slice((currentPage - 1) * tableSize, (currentPage * tableSize)).map((inst, index) => {
          let signingOfficialsList = [];
          if (!isNil(inst.signingOfficials)) {
            inst.signingOfficials.forEach((user) => {
              signingOfficialsList.push(span({style: {display: 'block'}}, `${user.displayName} (${user.email})`));
            });
          }
          const borderStyle = index > 0 ? {borderTop: '1px solid rgba(109,110,112,0.2)'} : {};
          return div({style: Object.assign({}, borderStyle, Styles.TABLE.RECORD_ROW), key: `${inst.id}-${index}`}, [
            div({
              style: Object.assign({}, Styles.TABLE.ID_CELL),
            }, [inst.id]),
            div({
              style: Object.assign({}, Styles.TABLE.INSTITUTION_CELL)
            }, [
              a({ style: {
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis'},
              onClick: () => { openUpdateModal(inst.id); }
              }, [inst.name])
            ]),
            div({
              style: Object.assign({}, {...Styles.TABLE.INSTITUTION_CELL, display: 'block'})
            }, signingOfficialsList),
            div({
              style: Object.assign({}, Styles.TABLE.DATA_ID_CELL)
            }, [inst.createUser ? inst.createUser.displayName : '']),
            div({
              style: Object.assign({}, Styles.TABLE.SUBMISSION_DATE_CELL)
            }, [inst.createDate]),
            div({
              style: Object.assign({}, Styles.TABLE.DATA_ID_CELL)
            }, [inst.updateUser ? inst.updateUser.displayName : '']),
            div({
              style: Object.assign({}, Styles.TABLE.SUBMISSION_DATE_CELL)
            }, [inst.updateDate]),
          ]);
        }),
        h(PaginationBar, {pageCount, currentPage, tableSize, goToPage, changeTableSize})
      ]),
      h(AddInstitutionModal, {
        isRendered: showUpdateInstitutionModal,
        showModal: showUpdateInstitutionModal,
        institutionId: institutionId,
        closeModal: closeUpdateModal,
        onOKRequest: onUpdateSave,
        onCloseRequest: closeUpdateModal
      }),
      h(ReactTooltip, {
        place: 'left',
        effect: 'solid',
        multiline: true,
        className: 'tooltip-wrapper'
      })
    ])
  );
}
