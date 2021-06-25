import { useState, useEffect } from 'react';
import { cloneDeep, isObject, includes, isNil, isEmpty } from 'lodash/fp';
import { h, div, label } from 'react-hyperscript-helpers';
import { Styles } from '../../libs/theme';
import CloseIconComponent from '../CloseIconComponent';
import Modal from 'react-modal';
import { SearchSelect } from '../SearchSelect';
import Creatable from 'react-select/creatable';
import SimpleButton from '../SimpleButton';
import { Theme } from '../../libs/theme';

const FormFieldRow = (props) => {
  const { card, dropdownOptions, updateInstitution, updateUser, modalType } = props;
  const [filteredDropdown, setFilteredDropdown] = useState(dropdownOptions);
  //NOTE: need to make own Select component for input
  //allows user to select from dropdown or put in their own name

  let template;

  const userListFilter = (searchTerm) => {
    let filteredCopy;
    if(isEmpty(searchTerm)) {
      filteredCopy = dropdownOptions;
    } else {
      const copiedDropdown = cloneDeep(filteredDropdown);
      filteredCopy = copiedDropdown.filter(user => {
        const userNameFilter = !isEmpty(user.displayName) ? includes(user.displayName)(searchTerm) : false;
        const emailFilter = !isEmpty(user.email) ? includes(user.email)(searchTerm) : false;
        return userNameFilter || emailFilter;
      });
    }
    setFilteredDropdown(filteredCopy);
  };

  if(!isNil(updateInstitution)) {
    //first template for institution selection
    template = div({style: {marginBottom: "2%"}}, [
      label({}, ['Institution']),
      h(SearchSelect, {
        id: `${label}-form-field`,
        name: label || '',
        onSelection: (selection) => updateInstitution(selection),
        options: dropdownOptions,
        placeholder: 'Search for institution...',
        value: card.institutionId
      })
    ]);
  } else {
    if(modalType === 'add') {
      template = div({style: {marginBottom: '2%'}}, [
        label({}, ['Users']),
        h(Creatable, {
          isClearable: true,
          onChange: updateUser,
          onInputChange: userListFilter,
          getNewOptionData: (input) => { return {email: input}; },
          options: dropdownOptions,
          placeholder: 'Select or type a new user email',
          getOptionLabel: (option) => `${option.displayName || 'New User'} (${option.email || "No email provided"})` || option.email
        })
      ]);
    } else {
      div({}, [card.displayName]);
    }
  }

  return div({display: 'flex'}, [template]);
};

export default function LibraryCardFormModal(props) {
  //NOTE: dropdown options need to be passed down from parent component
  //fetch for all institutions needs to happen on component init
  const { showModal, updateOnClick, createOnClick, closeModal, institutions, users, modalType} = props;

  const [card, setCard] = useState(props.card);

  useEffect(() => {
    setCard(props.card);
  }, [props.card]);

  const updateInstitution = (value) => {
    const updatedCard = cloneDeep(card);
    updatedCard.institutionId = value;
    setCard(updatedCard);
  };

  const updateUser = (value) => {
    debugger; // eslint-disable-line
    let userEmail, userId;
    if (isObject(value)) {
      userId = value.dacUserId;
      userEmail = value.email;
    } else {
      userEmail = value;
    }
    const updatedCard = Object.assign(card, { userEmail, userId });
    setCard(updatedCard);
  };

  const isConfirmDisabled = (modalType, card) => {
    let result;
    if(modalType === 'add') {
      result = isNil(card.userEmail) || isNil(card.institutionId);
    } else {
      result = isNil(card.institutionId);
    }
    return result;
  };

  return h(
    Modal,
    {
      isOpen: showModal,
      onRequestClose: closeModal,
      shouldCloseOnOverlayClick: true,
      style: {
        content: { ...Styles.MODAL.CONTENT },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
    [
      div({ style: Styles.MODAL.CONTENT }, [
        h(CloseIconComponent, { closeFn: closeModal }),
        div({ style: Styles.MODAL.TITLE_HEADER }, [
          modalType == 'add' ? 'Add Library Card' : 'Update Library Card',
        ]),
        div({ style: { borderBottom: '1px solid #1FB50' } }, []),
        h(FormFieldRow, {
          card,
          modalType,
          updateUser,
          dropdownOptions: users,
        }),
        h(FormFieldRow, {
          card,
          modalType,
          updateInstitution,
          dropdownOptions: institutions,
        }),
        div(
          {
            style: {
              display: 'flex',
              marginLeft: '85%',
              justifyContent: 'space-between',
            },
          },
          [
            h(SimpleButton, {
              onClick:
                modalType === 'add'
                  ? () => createOnClick(card)
                  : () => updateOnClick(card),
              additionalStyle: {
                flex: 1,
                display: 'inline-block',
                margin: '5%',
              },
              baseColor: Theme.palette.secondary,
              disabled: isConfirmDisabled(modalType, card),
              label: modalType === 'add' ? 'Add' : 'Update',
            }),
            h(SimpleButton, {
              onClick: closeModal,
              additionalStyle: {
                flex: 1,
                display: 'inline-block',
                margin: '5%',
              },
              baseColor: Theme.palette.secondary,
              label: 'Cancel'
            })
          ]
        ),
      ]),
    ]
  );
}