import {useEffect, useState} from 'react';
import {cloneDeep, includes, isEmpty, isNil, isObject} from 'lodash/fp';
import {div, h, label} from 'react-hyperscript-helpers';
import {Styles, Theme} from '../../libs/theme';
import CloseIconComponent from '../CloseIconComponent';
import Modal from 'react-modal';
import {SearchSelect} from '../SearchSelect';
import Creatable from 'react-select/creatable';
import SimpleButton from '../SimpleButton';

const FormFieldRow = (props) => {
  const { card, dropdownOptions, updateInstitution, updateUser, modalType, setCard } = props;

  const cardlessOptions = dropdownOptions.filter((option) => {
    const libraryCards = option.libraryCards || [];
    const savedCard = libraryCards.find(({institutionId}) => institutionId === card.institutionId);
    return isNil(savedCard);
  });
  const [filteredDropdown, setFilteredDropdown] = useState(cardlessOptions);

  let template;

  //filter function for users dropdown
  const userListFilter = ({searchTerm, card, setCard, action}) => {
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
    if(action !== 'input-blur' && action !== `menu-close`) {
      setCard(Object.assign({}, card, { email: searchTerm }));
    }
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
    //template here is for new card creation
    if(modalType === 'add') {
      template = div({style: {marginBottom: '2%'}}, [
        label({}, ['Users']),
        h(Creatable, {
          key: 'select-user',
          isClearable: true,
          onChange: updateUser,
          createOptionPosition: 'first',
          onInputChange: (input, {action}) => userListFilter({input, card, setCard, action}),
          getNewOptionData: (input) => { return {email: input}; },
          options: dropdownOptions,
          placeholder: 'Select or type a new user email',
          isOptionSelected: () => false, //Workaround to prevent odd react-select behavior where all dropdown options are highlighted
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
  const { showModal, updateOnClick, createOnClick, closeModal, institutions, users, modalType, lcaContent} = props;

  const [card, setCard] = useState(props.card);

  //initialization hook, sets card as state variables
  useEffect(() => {
    setCard(props.card);
  }, [props.card]);


  //onClick function, updates associated instituion on dropdown select
  const updateInstitution = (value) => {
    const updatedCard = cloneDeep(card);
    updatedCard.institutionId = value;
    setCard(updatedCard);
  };

  //onChange function, used to change associated user on Creatable dropdown selection
  const updateUser = (value) => {
    let userEmail, userId, userName, eraCommonsId;
    if (isObject(value)) {
      userId = value.dacUserId;
      userEmail = value.email;
      userName = value.displayName;
      eraCommonsId = value.eraCommonsId;
    } else {
      userEmail = value;
    }
    const updatedCard = Object.assign({}, card, { userEmail, userId, userName, eraCommonsId });
    setCard(updatedCard);
  };

  //boolean function, used to determine if submit button should be disabled
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
        // LCA
        isEmpty(lcaContent) ? div() : div({style: { maxWidth: 700, maxHeight: 200, overflow: 'auto' }}, [lcaContent]),
        //users dropdown
        h(FormFieldRow, {
          card,
          modalType,
          updateUser,
          setCard,
          dropdownOptions: users,
        }),
        //institution dropdown
        h(FormFieldRow, {
          isRendered: !isNil(institutions) && institutions.length > 1,
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