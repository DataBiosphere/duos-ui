import ConsentGroupForm from './consent_group/ConsentGroupForm';
import { useEffect, useState, useCallback } from 'react';
import { isNil, every } from 'lodash/fp';
import { div, h, h2, a, span } from 'react-hyperscript-helpers';
import { DAC } from '../../libs/ajax';
import { FormFieldTypes, FormField } from '../forms/forms';

import './ds_common.css';

const OPEN_ACCESS = 'Open Access';
const CLOSED_ACCESS = 'Closed Access';

const openClosedRadioOptions =     [
  {
    id: 'open_access',
    name: OPEN_ACCESS,
    text: 'Open Access'
  },
  {
    id: 'closed_access',
    name: CLOSED_ACCESS,
    text: 'Closed Access',
  }
];

export const DataAccessGovernance = (props) => {
  const {
    onChange
  } = props;

  const [consentGroupsState, setConsentGroupsState] = useState([]);
  const [dacs, setDacs] = useState([]);
  const [isClosedAccess, setIsClosedAccess] = useState(false);

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
  }, [consentGroupsState, onChange]);

  const addNewConsentGroup = useCallback(() => {
    setConsentGroupsState((state) => {
      state.push({
        consentGroup: {},
        nihInsitutionalCertificationFile: null,
        editMode: true,
        valid: false,
      });
      return state;
    });
  }, []);

  const deleteConsentGroup = useCallback((idx) => {
    setConsentGroupsState((state) => {
      state[idx] = undefined; // if deleted directly, keys based on idx would break.
      return state;
    });
  }, []);

  const updateConsentGroup = useCallback((idx, value, isValid) => {
    setConsentGroupsState((state) => {
      state[idx].editMode = false;
      state[idx].valid = isValid;
      state[idx].consentGroup = {
        ...state[idx].consentGroup,
        ...value,
      };
      return state;
    });
  }, []);

  const updateNihInstitutionalCertificationFile = useCallback((idx, file) => {
    setConsentGroupsState((state) => {
      state[idx].nihInsitutionalCertificationFile = file;
      return state;
    });
  }, []);

  const startEditConsentGroup = (idx) => {
    setConsentGroupsState((state) => {
      state[idx].editMode = true;
      return state;
    });
  };

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
          options: openClosedRadioOptions,
          onChange: ({ value, isValid }) => {
            onChange({
              key: 'alternativeDataSharingPlanControlledOpenAccess',
              value: value,
              isValid: isValid,
            });

            setIsClosedAccess(value === CLOSED_ACCESS);
          },
        }
      ),

      div({
        isRendered: isClosedAccess,
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
          .map((state, idx) => {
            if (isNil(state)) {
              return div({}, []);
            }

            return h(ConsentGroupForm, {
              key: idx,
              idx: idx,
              saveConsentGroup: (newGroup) => updateConsentGroup(idx, newGroup),
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