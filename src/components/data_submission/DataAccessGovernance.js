import ConsentGroupForm from './consent_group/ConsentGroupForm';
import { useEffect, useState } from 'react';
import { cloneDeep, isNil, every } from 'lodash/fp';
import { div, h, h2, a, span } from 'react-hyperscript-helpers';
import { DAC } from '../../libs/ajax';
import { FormFieldTypes, FormField } from '../forms/forms';

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

  const addNewConsentGroup = () => {
    const newConsentGroupsState = cloneDeep(consentGroupsState);
    newConsentGroupsState.push({
      consentGroup: {},
      editMode: true,
      valid: false,
    });
    setConsentGroupsState(newConsentGroupsState);
  };

  const deleteConsentGroup = (idx) => {
    const newConsentGroupsState = cloneDeep(consentGroupsState);
    newConsentGroupsState[idx] = undefined;
    setConsentGroupsState(newConsentGroupsState);
  };

  const updateConsentGroup = (idx, value, isValid) => {
    const newConsentGroupsState = cloneDeep(consentGroupsState);
    newConsentGroupsState[idx] = {
      editMode: false,
      valid: isValid,
      consentGroup: {
        ...consentGroupsState[idx],
        ...value,
      }
    };
    setConsentGroupsState(newConsentGroupsState);
  };

  const startEditConsentGroup = (idx) => {
    const newConsentGroupsState = cloneDeep(consentGroupsState);
    newConsentGroupsState[idx].editMode = true;
    setConsentGroupsState(newConsentGroupsState);
  };

  return div({
    style: {
      padding: '50px 0',
      maxWidth: 800,
      margin: 'auto'
    }
  }, [
    h2('Data Access Governance'),
    div({}, [

      h(FormField,
        {
          type: FormFieldTypes.RADIO,
          id: 'dataSharingPlan',
          title: 'Does the data need to be managed under Controlled or Open Access?',
          options: openClosedRadioOptions,
          onChange: ({ value, isValid }) => {
            onChange({
              key: 'alternativeDataSharingPlanControlledOpenAccess',
              value: value.selected,
              isValid: isValid,
            });

            setIsClosedAccess(value.selected === CLOSED_ACCESS);
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
          allowManualEntry: false,
          selectOptions: dacs.map((dac) => {
            return { dacId: dac.dacId, displayValue: dac.name };
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
            id: 'btn_addInstitution',
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
              startEditConsentGroup: () => startEditConsentGroup(idx),
            });
          })
      ]),
    ])
  ]);
};

export default DataAccessGovernance;