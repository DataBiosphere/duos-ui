import ConsentGroupForm from './consent_group/ConsentGroupForm';
import { useEffect, useState, useCallback } from 'react';
import { isNil, every, cloneDeep } from 'lodash/fp';
import { div, h, h2, h3, a, span } from 'react-hyperscript-helpers';
import { DAC } from '../../libs/ajax';
import { FormFieldTypes, FormField } from '../forms/forms';

import './ds_common.css';

const OPEN_ACCESS = 'Open Access';
const CONTROLLED_ACCESS = 'Controlled Access';

const openControlledRadioOptions =     [
  {
    id: 'open_access',
    name: OPEN_ACCESS,
    text: 'Open Access'
  },
  {
    id: 'controlled_access',
    name: CONTROLLED_ACCESS,
    text: 'Controlled Access',
  }
];

export const DataAccessGovernance = (props) => {
  const {
    onChange, onFileChange
  } = props;

  const [consentGroupsState, setConsentGroupsState] = useState([]);
  const [dacs, setDacs] = useState([]);
  const [isControlledAccess, setIsControlledAccess] = useState(false);

  useEffect(() => {
    DAC.list(false).then((dacList) => {
      setDacs(dacList);
    });
  }, []);

  useEffect(() => {
    const filteredConsentGroupsState = consentGroupsState.filter(state => !isNil(state));

    const groups = filteredConsentGroupsState.map(state => state.consentGroup);
    const valid = every(filteredConsentGroupsState.map(state => (!state.editMode) && state.valid));

    onChange({key: 'consentGroups', value: groups, isValid: valid});

    filteredConsentGroupsState.forEach((cgState, idx) => {
      onFileChange({
        key: `consentGroups[${idx}].nihInstitutionalCertificationFile`,
        value: cgState?.nihInstitutionalCertificationFile,
        isValid: true
      });
    });
  }, [consentGroupsState, onChange, onFileChange]);

  const addNewConsentGroup = useCallback(() => {
    setConsentGroupsState((consentGroupsState) => {
      const newConsentGroupsState = cloneDeep(consentGroupsState);
      newConsentGroupsState.push({
        consentGroup: {},
        nihInstitutionalCertificationFile: null,
        editMode: true,
        valid: false,
      });

      return newConsentGroupsState;
    });
  }, []);

  const deleteConsentGroup = useCallback((idx) => {
    setConsentGroupsState((consentGroupsState) => {
      const newConsentGroupsState = cloneDeep(consentGroupsState);
      newConsentGroupsState[idx] = undefined; // if deleted directly, keys based on idx would break.
      return newConsentGroupsState;
    });
  }, []);

  const updateConsentGroup = useCallback((idx, value, isValid) => {
    setConsentGroupsState((consentGroupsState) => {
      const newConsentGroupsState = cloneDeep(consentGroupsState);

      newConsentGroupsState[idx].editMode = false;
      newConsentGroupsState[idx].valid = isValid;
      newConsentGroupsState[idx].consentGroup = {
        ...newConsentGroupsState[idx].consentGroup,
        ...value,
      };
      return newConsentGroupsState;
    });
  }, []);

  const updateNihInstitutionalCertificationFile = useCallback((idx, file) => {
    setConsentGroupsState((consentGroupsState) => {
      const newConsentGroupsState = cloneDeep(consentGroupsState);
      newConsentGroupsState[idx].nihInstitutionalCertificationFile = file;
      return newConsentGroupsState;
    });
  }, []);

  const startEditConsentGroup = useCallback((idx) => {
    setConsentGroupsState((consentGroupsState) => {
      const newConsentGroupsState = cloneDeep(consentGroupsState);
      newConsentGroupsState[idx].editMode = true;
      return newConsentGroupsState;
    });
  }, []);

  return div({
    className: 'data-submitter-section',
  }, [
    h2('Data Access Governance'),
    div({}, [

      h(FormField,
        {
          type: FormFieldTypes.RADIOGROUP,
          id: 'dataSharingPlan',
          title: 'Does the data need to be managed under Controlled or Open Access?',
          options: openControlledRadioOptions,
          onChange: ({ value, isValid }) => {
            onChange({
              key: 'alternativeDataSharingPlanControlledOpenAccess',
              value: value,
              isValid: isValid,
            });

            setIsControlledAccess(value === CONTROLLED_ACCESS);
          },
        }
      ),

      div({
        isRendered: isControlledAccess,
      },
      [
        h(FormField, {
          id: 'dataAccessCommitteeId',
          title: 'Data Access Committee*',
          description: 'Please select which DAC should govern requests for this dataset',
          type: FormFieldTypes.SELECT,
          selectOptions: dacs.map((dac) => {
            return { dacId: dac.dacId, displayText: dac.name };
          }),
          onChange: ({key, value}) => {
            onChange({key, value: value.dacId});
          }
        }),

        h3(['Consent Group Information']),

        // add consent group
        div({
          className: 'right-header-section',
          id: 'add-new-consent-group-btn',
          style: {
            display: 'flex',
            alignItems: 'flex-end',
            margin: '2rem 0 2rem 0'
          }}, [
          a({
            id: 'btn_addConsentGroup',
            className: 'btn-primary btn-add common-background',
            onClick: () => addNewConsentGroup(),
          }, [
            span({}, ['Add Consent Group'])
          ])
        ]),

        // consent groups
        consentGroupsState
          ?.map((state, idx) => {
            if (isNil(state)) {
              return div({}, []);
            }

            return h(ConsentGroupForm, {
              key: idx,
              idx: idx,
              saveConsentGroup: (newGroup) => updateConsentGroup(idx, newGroup.value, newGroup.valid),
              deleteConsentGroup: () => deleteConsentGroup(idx),
              updateNihInstitutionalCertificationFile: (file) => updateNihInstitutionalCertificationFile(idx, file),
              startEditConsentGroup: () => startEditConsentGroup(idx),
            });
          })
      ]),
    ])
  ]);
};

export default DataAccessGovernance;