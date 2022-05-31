import { useState, useRef, useEffect } from 'react';
import {div, form, label, input } from 'react-hyperscript-helpers';
import { Alert } from '../Alert';
import { Institution } from '../../libs/ajax';
import { BaseModal } from '../BaseModal';
import addInstitutionIcon from '../../images/icon_add_dac.png';
import editInstitutionIcon from '../../images/icon_edit_dac.png';
import { Notifications } from '../../libs/utils';

const AddInstitutionModal = (props) => {
  const { showModal, institutionId, onCloseRequest, onOKRequest } = props;
  const [validForm, setValidForm] = useState(false);
  const [institutionNameValid, setInstitutionNameValid] = useState(false);
  const [institution, setInstitution] = useState();
  const [instId] = useState(institutionId);
  const [institutionName, setInstitutionName] = useState('');
  const name = props.institution ? props.institution.name : '';
  const [submitted, setSubmitted] = useState(false);
  const nameRef = useRef(name);
  const [mode, setMode] = useState('Add');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!instId)
        return;
      setIsLoading(true);

      setMode('Edit');

      try {
        const institution = await Institution.getById(instId);
        setInstitution(institution);
        setInstitutionName(institution.name);
      } catch (e) {
        Notifications.showError('Unable to load Institution');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [instId]);

  const handleChange = (e, field) => {
    switch (field) {
      case 'name': {
        setInstitutionNameValid(e.currentTarget.validity.valid);
        setInstitutionName(e.currentTarget.value);
        break;
      }
    }
  };

  const changeHandler = (field) => {
    return (e) => {
      handleChange(e, field);
    };
  };

  const formChange = () => {
    setValidForm(institutionNameValid);
  };

  const closeHandler = () => {
    onCloseRequest();
  };

  const OKHandler = async (event) => {
    event.persist();
    setSubmitted(true);

    if (!institutionNameValid) {
      return;
    }

    let result = undefined;

    switch (mode) {
      case 'Add': {
        const newInstitution = {
          name: institutionName
        };
        try {
          result = await Institution.postInstitution(newInstitution);
        } catch (e) {
          Notifications.showError({ text: 'Unable to save institution by that name' });
        }
        break;
      }
      case 'Edit': {
        const editInstitution = {
          name: institutionName
        };
        try {
          result = await Institution.putInstitution(institution.id, editInstitution);
        } catch (e) {
          Notifications.showError({ text: 'Unable to save institution by that name' });
        }
        break;
      }
    }

    event.preventDefault();
    onOKRequest(result);
  };

  return BaseModal({
    id: 'addInstitutionModal',
    showModal: showModal,
    disableOkBtn: !validForm,
    onRequestClose: closeHandler,
    imgSrc: mode === 'Add' ? addInstitutionIcon : editInstitutionIcon,
    color: 'common',
    title: mode === 'Add' ? 'Add Institution' : 'Edit Institution',
    description: mode === 'Add' ? 'Add a new Institution in the system' : 'Edit an Institution in the system',
    action: { label: mode === 'Add' ? 'Add' : 'Save', handler: OKHandler }
  },
  [
    form({ isRendered: !isLoading, className: 'form-horizontal css-form', name: 'userForm', encType: 'multipart/form-data', onChange: formChange }, [
      div({ className: 'form-group first-form-group' }, [
        label({ id: 'lbl_institution_name', className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color' }, ['Institution Name']),
        div({ className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8' }, [
          input({
            type: 'text',
            name: 'name',
            id: 'txt_name',
            className: 'form-control col-lg-12',
            placeholder: 'Institution name',
            required: true,
            autoFocus: true,
            value: institutionName,
            onChange: changeHandler('name'),
            ref: nameRef
          })
        ]),
        div({ isRendered: institutionNameValid === false && submitted === true }, [
          Alert({
            id: 'institutionNameInvalid', type: 'danger', title: 'Field required!',
            description: 'Please provide a name for the institution.'
          })
        ])
      ]),
    ])
  ]);
};

export default AddInstitutionModal;
