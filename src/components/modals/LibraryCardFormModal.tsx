import React, {useEffect, useState} from 'react';
import {cloneDeep, includes, isEmpty, isNil, isObject} from 'lodash/fp';
import {Styles, Theme} from 'src/libs/theme';
import CloseIconComponent from 'src/components/CloseIconComponent';
import ModalWrapper from "src/components/collaborator_list/ModalWrapper";
import Creatable from 'react-select/creatable';
import SimpleButton from 'src/components/SimpleButton';
import {LibraryCardAgreementTermsDownload} from 'src/components/LibraryCardAgreementTermsDownload';
import {SingleValue} from 'react-select';
import {LibraryCard} from 'src/types/model';

// This represents the fields describing users in a selection dropdown menu
interface UserOption {
  userId: number;
  displayName: string;
  email: string;
  libraryCards?: LibraryCard[];
}

interface FormFieldRowProps {
  card: LibraryCard;
  dropdownOptions: UserOption[];
  updateUser: (value: SingleValue<UserOption>) => void;
  setCard: React.Dispatch<React.SetStateAction<LibraryCard>>;
}

export interface LibraryCardFormModalProps {
  showModal: boolean;
  createOnClick: (card: LibraryCard) => void;
  closeModal: () => void;
  users: UserOption[];
  card: LibraryCard;
}

interface FilterOptions {
  searchTerm?: string;
  input?: string;
  card: LibraryCard;
  setCard: React.Dispatch<React.SetStateAction<LibraryCard>>;
  action: string;
}

const FormFieldRow: React.FC<FormFieldRowProps> = (props) => {
  const { card, dropdownOptions, updateUser, setCard } = props;

  const cardlessOptions = dropdownOptions.filter((option) => isEmpty(option.libraryCards));
  const [filteredDropdown, setFilteredDropdown] = useState<UserOption[]>(cardlessOptions);

  //filter function for users dropdown
  const userListFilter = ({ searchTerm, input, card, setCard, action }: FilterOptions) => {
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
    if (action !== 'input-blur' && action !== 'menu-close') {
      setCard({...card, ...{email: term}});
    }
  };

  return (
      <div style={{display: 'flex'}}>
        <div style={{marginBottom: '2%', width: '100%'}}>
          <p><strong>Users</strong></p>
          <Creatable
              key="select-user"
              isClearable={true}
              onChange={updateUser}
              createOptionPosition="first"
              onInputChange={(input: string, { action }: { action: string }) =>
                  userListFilter({ input, card, setCard, action })}
              getNewOptionData={(input: string) => {
                return { email: input } as UserOption;
              }}
              options={dropdownOptions}
              placeholder="Select or type a new user email"
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
  const [card, setCard] = useState<LibraryCard>(props.card);

  //initialization hook, sets card as state variables
  useEffect(() => {
    setCard(props.card);
  }, [props.card]);

  const updateUser = (value: SingleValue<UserOption> | string) => {
    let userEmail, userId, userName;
    if (isObject(value)) {
      const userOption = value;
      userId = userOption.userId;
      userEmail = userOption.email;
      userName = userOption.displayName;
    } else {
      userEmail = value;
    }
    const updatedCard = {...card, userEmail, userId, userName};
    setCard(updatedCard as LibraryCard);
  };

  //boolean function, used to determine if submit button should be disabled
  const isConfirmDisabled = (card: LibraryCard): boolean => {
    return isNil(card.userEmail);
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
            Add Library Card
          </div>
          <div style={{borderBottom: '1px solid #1FB50'}}/>
          {/* LCA Terms Download */}
          <LibraryCardAgreementTermsDownload/>
          {/* users dropdown */}
          <FormFieldRow
              card={card}
              updateUser={updateUser}
              setCard={setCard}
              dropdownOptions={users}
          />
          <div style={{display: 'inline-block'}}>
            By clicking {'\'ADD\''} you agree to the terms of the agreements above for this user.
          </div>
          <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
              }}
          >
            <SimpleButton
                data-cy={'library-card-form-modal-add-button'}
                onClick={() => createOnClick(card)}
                additionalStyle={{margin: '0%', width: '80px', height: '15px', padding: '20px'}}
                baseColor={Theme.palette.secondary}
                disabled={isConfirmDisabled(card)}
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
