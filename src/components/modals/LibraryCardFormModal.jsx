import React, {useEffect, useState} from 'react';
import {cloneDeep, includes, isEmpty, isNil, isObject} from 'lodash/fp';
import {Styles, Theme} from '../../libs/theme';
import CloseIconComponent from '../CloseIconComponent';
import Modal from 'react-modal';
import Creatable from 'react-select/creatable';
import SimpleButton from '../SimpleButton';
import {LibraryCardAgreementTermsDownload} from '../LibraryCardAgreementTermsDownload';

const FormFieldRow = (props) => {
  const { card, dropdownOptions, updateUser, modalType, setCard } = props;

  const cardlessOptions = dropdownOptions.filter((option) => isEmpty(option.libraryCards));
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
        /* eslint-disable-next-line no-constant-binary-expression */
        getOptionLabel={(option) => `${option.displayName || 'New User'} (${option.email || 'No email provided'})` || option.email}
      />
    </div>;
  } else {
    <div>{card.displayName}</div>;
  }
  return <div style={{ display: 'flex' }}>{template}</div>;
};

export default function LibraryCardFormModal(props) {
  //NOTE: dropdown options need to be passed down from parent component
  const { showModal, updateOnClick, createOnClick, closeModal, users, modalType } = props;

  const [card, setCard] = useState(props.card);

  //initialization hook, sets card as state variables
  useEffect(() => {
    setCard(props.card);
  }, [props.card]);


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
  const isConfirmDisabled = (card) => {
    return isNil(card.userEmail);
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
        {/* LCA Terms Download */}
        <LibraryCardAgreementTermsDownload/>
        {/* users dropdown */}
        <FormFieldRow
          card={card}
          modalType={modalType}
          updateUser={updateUser}
          setCard={setCard}
          dropdownOptions={users}
        />
        <div style={{ display:'inline-block' }}>
          By clicking {modalType === 'add'? "'ADD'" : "'UPDATE'" } you agree to the terms of the agreements above for this user.
        </div>
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
            disabled={isConfirmDisabled(card)}
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