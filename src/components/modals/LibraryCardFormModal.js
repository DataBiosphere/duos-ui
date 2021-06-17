import { h, div, input } from 'react-hyperscript-helpers';
import { Styles } from '../../libs/theme';
import CloseIconComponent from '../CloseIconComponent';
import Modal from 'react-modal';
import { isEmpty, isNil } from 'lodash';
import { SearchSelect } from '../SearchSelect';

const FormFieldRow = (props) => {
  //NOTE: don't need index, cards have unique ids associated with them
  const { libraryCard, updateFn, dropdownOptions, key, label } = props;

  let template;
  const placeholder = `Search for ${label}...`;
  //updateFn -> needs to take key, value and update model on the parent
  //Parent can search for the element on filtered and original and update models accordingly

  if(!isNil(dropdownOptions) && !isEmpty(dropdownOptions)) {
    template = h(SearchSelect, {
      id: label,
      name: label,
      onSelection: updateFn,
      options: dropdownOptions,
      placeholder,
      value: libraryCard.institution.id
    });
  } else {
    template = input({
      type: 'text',
      value: libraryCard[key],
      onChange: updateFn,
      placeholder
    });
  }

  return div({display: 'flex'}, [template]);
};

export default function LibraryCardFormModal(props) {
  //NOTE: dropdown options need to be passed down from parent component
  //fetch for all institutions needs to happen on component init
  const { updateFn, closeModal, showModal, libraryCard, title, dropdownOptions, onSubmitFn} = props;

  return h(Modal, {
    isOpen: showModal,
    onRequestClose: closeModal,
    shouldCloseOnOverlayClick: true,
    style: {
      content: { ...Styles.MODAL.CONTENT },
      overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }
    }
  }, [
    div({style: Styles.MODAL.CONTENT}, [
      h(CloseIconComponent, {closeFn: closeModal}),
      div({style: Styles.MODAL.TITLE_HEADER}, [title]),
      div({style: { borderBottom: "1px solid #1FB50"}}, []),
      h(FormFieldRow, {libraryCard, updateFn, dropdownOptions, key: 'institutionId', label: 'Institution' })
    ])
  ]);
}