import React, {useEffect, useState} from 'react';
import {cloneDeep, includes, isEmpty, isNil, isObject} from 'lodash/fp';
import {Styles, Theme} from '../../libs/theme';
import CloseIconComponent from '../CloseIconComponent';
import Modal from 'react-modal';
import {SearchSelect} from '../SearchSelect';
import Creatable from 'react-select/creatable';
import SimpleButton from '../SimpleButton';
import {LibraryCardAgreementTermsDownload} from '../LibraryCardAgreementTermsDownload';

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
    if(action !== 'input-blur' && action !== 'menu-close') {
      setCard(Object.assign({}, card, { email: searchTerm }));
    }
  };

  if(!isNil(updateInstitution)) {
    //first template for institution selection
    template = <div style={{ marginBottom: '2%', width:'100%' }}>
      <label>Institution</label>
      <SearchSelect
        id={'institution-form-field'}
        name='Institution'
        onSelection={(selection) => updateInstitution(selection?.value?.institutionId)}
        options={dropdownOptions}
        placeholder='Search for institution...'
        value={card.institutionId}
      />
    </div>;
  } else {
    //template here is for new card creation
    if (modalType === 'add') {
      template = <div style={{ marginBottom: '2%', width:'100%' }}>
        <label>Users</label>
        <Creatable
          key='select-user'
          isClearable={true}
          onChange={updateUser}
          createOptionPosition='first'
          onInputChange={(input, { action }) => userListFilter({ input, card, setCard, action })}
          getNewOptionData={(input) => { return { email: input }; }}
          options={dropdownOptions}
          placeholder='Select or type a new user email'
          isOptionSelected={() => false} //Workaround to prevent odd react-select behavior where all dropdown options are highlighted
          getOptionLabel={(option) => `${option.displayName || 'New User'} (${option.email || 'No email provided'})` || option.email}
        />
      </div>;
    } else {
      <div>{card.displayName}</div>;
    }
  }
  return <div style={{ display: 'flex' }}>{template}</div>;
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
      userId = value.userId;
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

  return (
    <Modal
      isOpen={showModal}
      onRequestClose={closeModal}
      shouldCloseOnOverlayClick={true}
      style={{
        content: { ...Styles.MODAL.CONTENT },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <div style={Styles.MODAL.CONTENT}>
        <CloseIconComponent closeFn={closeModal} />
        <div style={Styles.MODAL.TITLE_HEADER}>
          {modalType === 'add' ? 'Add Library Card' : 'Update Library Card'}
        </div>
        <div style={{ borderBottom: '1px solid #1FB50' }} />
        {/* Library Card Agreement Text */}
        {lcaContent}
        {/* LCA Terms Download */}
        {LibraryCardAgreementTermsDownload}
        {/* users dropdown */}
        <FormFieldRow
          card={card}
          modalType={modalType}
          updateUser={updateUser}
          setCard={setCard}
          dropdownOptions={users}
        />
        {/* institution dropdown */}
        {
          !isNil(institutions) && institutions.length > 1 && (
            <FormFieldRow
              card={card}
              modalType={modalType}
              updateInstitution={updateInstitution}
              dropdownOptions={institutions}
            />
          )
        }
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <SimpleButton
            onClick={modalType === 'add' ? () => createOnClick(card) : () => updateOnClick(card)}
            additionalStyle={{ margin: '0%', width: '80px', height: '15px', padding: '20px' }}
            baseColor={Theme.palette.secondary}
            disabled={isConfirmDisabled(modalType, card)}
            label={modalType === 'add' ? 'Add' : 'Update'}
          />
          <SimpleButton
            onClick={closeModal}
            additionalStyle={{ marginLeft: '1%', width: '80px', height: '15px', padding: '20px' }}
            baseColor={Theme.palette.secondary}
            label='Cancel'
          />
        </div>
      </div>
    </Modal>
  );
}