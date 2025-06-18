import React, {useState} from 'react';
import {cloneDeep, includes, isEmpty, isNil} from 'lodash/fp';
import {Styles, Theme} from 'src/libs/theme';
import CloseIconComponent from 'src/components/CloseIconComponent';
import ModalWrapper from 'src/components/collaborator_list/ModalWrapper';
import Creatable from 'react-select/creatable';
import SimpleButton from 'src/components/SimpleButton';
import {LibraryCardAgreementTermsDownload} from 'src/components/LibraryCardAgreementTermsDownload';
import {MultiValue} from 'react-select';
import {LibraryCard} from 'src/types/model';

// This represents the fields describing users in a selection dropdown menu
interface UserOption {
  userId: number;
  displayName: string;
  email: string;
  libraryCard?: LibraryCard;
}

interface FormFieldRowProps {
  selectedUsers: UserOption[];
  dropdownOptions: UserOption[];
  updateUsers: (values: MultiValue<UserOption>) => void;
}

export interface LibraryCardFormModalProps {
  showModal: boolean;
  createOnClick: (cards: LibraryCard[]) => void;
  closeModal: () => void;
  users: UserOption[];
  card: LibraryCard;
}

interface FilterOptions {
  searchTerm?: string;
  input?: string;
  action: string;
}

const FormFieldRow: React.FC<FormFieldRowProps> = (props) => {
  const { selectedUsers, dropdownOptions, updateUsers } = props;

  const cardlessOptions = dropdownOptions.filter((option) => isNil(option.libraryCard));
  const [filteredDropdown, setFilteredDropdown] = useState<UserOption[]>(cardlessOptions);

  //filter function for users dropdown
  const userListFilter = ({ searchTerm, input }: FilterOptions) => {
    const term = searchTerm ?? input ?? '';
    let filteredCopy: UserOption[];

    if (isEmpty(term)) {
      filteredCopy = dropdownOptions;
    } else {
      const copiedDropdown = cloneDeep(filteredDropdown);
      filteredCopy = copiedDropdown.filter(user => {
        const userNameFilter = !isEmpty(user.displayName) ? includes(term)(user.displayName) : false;
        const emailFilter = !isEmpty(user.email) ? includes(term)(user.email) : false;
        return userNameFilter ?? emailFilter;
      });
    }
    setFilteredDropdown(filteredCopy);
  };

  return (
      <div style={{display: 'flex'}}>
        <div style={{marginBottom: '2%', width: '100%'}}>
          <p><strong>Users</strong></p>
          <Creatable
              key="select-user"
              isClearable={true}
              isMulti={true}
              onChange={updateUsers}
              value={selectedUsers}
              createOptionPosition="first"
              onInputChange={(input: string, { action }: { action: string }) =>
                  userListFilter({ input, action })}
              getNewOptionData={(input: string) => {
                return { email: input } as UserOption;
              }}
              options={cardlessOptions}
              placeholder="Select or type new user emails"
              isOptionSelected={() => false} //Workaround to prevent odd react-select behavior where all dropdown options are highlighted
              /* eslint-disable-next-line no-constant-binary-expression */
              getOptionLabel={(option: UserOption) => `${option.displayName || 'New User'} (${option.email || 'No email provided'})` || option.email || ''}
          />
        </div>
      </div>
  );
};

const LibraryCardFormModal = (props: LibraryCardFormModalProps) => {
  const { showModal, createOnClick, closeModal, users } = props;
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);

  // Create a library card for each selected user
  const createLibraryCards = () => {
    if (selectedUsers.length === 0) return;

    // Map selected users to library cards
    const cards = selectedUsers.map(user => {
      return {
        userId: user.userId,
        userEmail: user.email,
        userName: user.displayName,
      } as LibraryCard;
    });

    createOnClick(cards);
    setSelectedUsers([]);
  };

  // Handle multi-selection changes
  const updateUsers = (newValues: MultiValue<UserOption>) => {
    setSelectedUsers(newValues as UserOption[]);
  };

  // Check if we have any selected users
  const isConfirmDisabled = (): boolean => {
    return selectedUsers.length === 0;
  };

  return (
      <ModalWrapper
          isOpen={showModal}
          onRequestClose={closeModal}
          shouldCloseOnOverlayClick={true}
          style={{
            content: {...Styles.MODAL.CONTENT},
            overlay: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
          }}
      >
        <div data-cy={'library-card-form-modal'} style={Styles.MODAL.CONTENT}>
          <CloseIconComponent closeFn={closeModal}/>
          <div style={Styles.MODAL.TITLE_HEADER}>
            Add Library Cards
          </div>
          <div style={{borderBottom: '1px solid #1FB50'}}/>
          {/* LCA Terms Download */}
          <LibraryCardAgreementTermsDownload/>
          {/* users dropdown */}
          <FormFieldRow
              selectedUsers={selectedUsers}
              updateUsers={updateUsers}
              dropdownOptions={users}
          />
          <div style={{display: 'inline-block'}}>
            By clicking {'\'ADD\''} you agree to the terms of the agreements above for all users.
          </div>
          <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
              }}
          >
            <SimpleButton
                data-cy={'library-card-form-modal-add-button'}
                onClick={createLibraryCards}
                additionalStyle={{margin: '0%', width: '80px', height: '15px', padding: '20px'}}
                baseColor={Theme.palette.secondary}
                disabled={isConfirmDisabled()}
                label={'Add'}
            />
            <SimpleButton
                data-cy={'library-card-form-modal-close-button'}
                onClick={closeModal}
                additionalStyle={{marginLeft: '1%', width: '80px', height: '15px', padding: '20px'}}
                baseColor={Theme.palette.secondary}
                label="Cancel"
            />
          </div>
        </div>
      </ModalWrapper>
  );
};

export default LibraryCardFormModal;
