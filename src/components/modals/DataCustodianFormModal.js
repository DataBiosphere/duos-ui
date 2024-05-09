import React, { useState, useEffect } from 'react';
import { cloneDeep, isObject, includes, isNil, isEmpty } from 'lodash/fp';
import { Styles } from '../../libs/theme';
import CloseIconComponent from '../CloseIconComponent';
import Modal from 'react-modal';
import Creatable from 'react-select/creatable';
import SimpleButton from '../SimpleButton';
import { Theme } from '../../libs/theme';

//NOTE: functionality is set for demo purposes on SO Console (no admin functionality)
//As such, changes to "data" don't persist

const FormFieldRow = (props) => {
  const {
    user,
    dropdownOptions,
    updateUser,
    setUser,
  } = props;

  const nonCustodians = dropdownOptions.filter((option) => {
    return !option.isDataCustodian;
  });
  const [filteredDropdown, setFilteredDropdown] = useState(nonCustodians);

  //filter function for users dropdown
  const userListFilter = ({ searchTerm, user, setUser, action }) => {
    let filteredCopy;
    if (isEmpty(searchTerm)) {
      filteredCopy = filteredDropdown;
    } else {
      const copiedDropdown = cloneDeep(filteredDropdown);
      filteredCopy = copiedDropdown.filter((user) => {
        const userNameFilter = !isEmpty(user.displayName)
          ? includes(user.displayName)(searchTerm)
          : false;
        const emailFilter = !isEmpty(user.email)
          ? includes(user.email)(searchTerm)
          : false;
        return userNameFilter || emailFilter;
      });
    }
    setFilteredDropdown(filteredCopy);
    if (action !== 'input-blur' && action !== 'menu-close') {
      setUser(Object.assign({}, user, { email: searchTerm }));
    }
  };

  let template = <div style={{ marginBottom: '2%' }}>
    <label>Users</label>
    <Creatable
      key='select-user'
      isClearable={true}
      onChange={updateUser}
      createOptionPosition='first'
      onInputChange={(input, { action }) => userListFilter({ input, user, setUser, action })}
      getNewOptionData={(input) => ({ email: input })}
      options={dropdownOptions}
      placeholder='Select or type a new user email'
      isOptionSelected={() => false} //Workaround to prevent odd react-select behavior where all dropdown options are highlighted
      getOptionLabel={(option) =>
        `${option.displayName || 'New User'} (${option.email || 'No email provided'})` || option.email
      }
    />
  </div>;

  return <div style={{display:'flex'}}>{template}</div>;
};

export default function DataCustodianFormModal(props) {
  //NOTE: dropdown options need to be passed down from parent component
  const {
    showModal,
    createOnClick,
    closeModal,
    users,
    dpaContent
  } = props;

  const [user, setUser] = useState(props.user);

  //initialization hook, sets card as state variables
  useEffect(() => {
    setUser(props.user);
  }, [props.user]);

  //onChange function, used to change associated user on Creatable dropdown selection
  const updateUser = (value) => {
    let targetUser = {};
    if (isObject(value)) {
      targetUser = value;
    } else {
      targetUser.email = value;
    }
    setUser(targetUser);
  };

  //boolean function, used to determine if submit button should be disabled
  const isConfirmDisabled = (user) => {
    return isNil(user) || isNil(user.email);
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
        <div style={Styles.MODAL.TITLE_HEADER}>Add Data Submitter</div>
        {dpaContent}
        <div style={{ borderBottom: '1px solid #1FB50' }}></div>
        {/* users dropdown */}
        <FormFieldRow
          user={user}
          updateUser={updateUser}
          setUser={setUser}
          dropdownOptions={users}
        />
        <div style={{ display: 'flex', marginLeft: '85%', justifyContent: 'flex-end' }}>
          <SimpleButton
            onClick={() => createOnClick(user)}
            additionalStyle={{ flex: 1, display: 'inline-block', margin: '5%' }}
            baseColor={Theme.palette.secondary}
            disabled={isConfirmDisabled(user)}
            label='Add'
          />
          <SimpleButton
            onClick={closeModal}
            additionalStyle={{ flex: 1, display: 'inline-block', margin: '5%' }}
            baseColor={Theme.palette.secondary}
            label='Cancel'
          />
        </div>
      </div>
    </Modal>
  );
}
