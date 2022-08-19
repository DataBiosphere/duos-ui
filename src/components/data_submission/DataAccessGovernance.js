import ConsentGroupForm from './ConsentGroupForm';
import { useEffect, useState } from 'react';
import { cloneDeep, isNil } from 'lodash/fp';
import { div, h, a, span, label } from 'react-hyperscript-helpers';
import { DAC } from '../../libs/ajax';
import {SearchSelect} from '../SearchSelect';
import {RadioButton} from '../RadioButton';
import DataSubmitterStyles from './DataSubmitterStyles';


const OPEN_ACCESS = 'Open Access';
const CLOSED_ACCESS = 'Closed Access';


export const DataAccessGovernance = (props) => {
  const {
    formData, updateFormData
  } = props;

  const [consentGroups, setConsentGroups] = useState((isNil(formData.consentGroups) ? [] : formData.consentGroups));
  const [dacs, setDacs] = useState([]);

  useEffect(() => {
    DAC.list(false).then((dacList) => {
      setDacs(dacList);
    });
  }, []);

  const addNewConsentGroup = () => {
    const newConsentGroups = cloneDeep(consentGroups);
    newConsentGroups.push({});
    setConsentGroups(newConsentGroups);
    updateFormData({
      consentGroups: newConsentGroups.filter((val) => !isNil(val)),
    });
  };

  const deleteConsentGroup = (idx) => {
    const newConsentGroups = cloneDeep(consentGroups);
    newConsentGroups[idx] = undefined;
    setConsentGroups(newConsentGroups);
    updateFormData({
      consentGroups: newConsentGroups.filter((val) => !isNil(val)),
    });
  };

  const updateConsentGroup = (idx, update) => {
    const newConsentGroups = cloneDeep(consentGroups);
    newConsentGroups[idx] = {
      ...consentGroups[idx],
      ...update,
    };
    setConsentGroups(newConsentGroups);
    updateFormData({
      consentGroups: newConsentGroups.filter((val) => !isNil(val)),
    });
  };

  return div({
    style: {
      padding: '50px 0',
      maxWidth: 800,
      margin: 'auto'
    }
  }, [
    label({
      id: 'access_header',
      className: 'control-label',
      style: DataSubmitterStyles.sectionHeader,
    }, ['Data Access Governance']),


    div({}, [

      // open or closed access
      label({
        id: 'access_header',
        className: 'control-label',
        style: DataSubmitterStyles.header,
      }, ['Does the data need to be managed under Controlled or Open Access?']),
      div({
        style: DataSubmitterStyles.radioContainer,
      }, [
        RadioButton({
          style: DataSubmitterStyles.radioButton,
          id: 'alternativeDataSharingPlanControlledOpenAccess',
          name: 'alternativeDataSharingPlanControlledOpenAccess',
          value: 'alternativeDataSharingPlanControlledOpenAccess',
          defaultChecked: formData.alternativeDataSharingPlanControlledOpenAccess === OPEN_ACCESS,
          onClick: () => updateFormData({
            alternativeDataSharingPlanControlledOpenAccess: OPEN_ACCESS,
          }),
          description: 'Open Access',
        }),
      ]),

      div({
        style: DataSubmitterStyles.radioContainer,
      }, [
        RadioButton({
          style: DataSubmitterStyles.radioButton,
          id: 'alternativeDataSharingPlanControlledClosedAccess',
          name: 'alternativeDataSharingPlanControlledClosedAccess',
          value: 'alternativeDataSharingPlanControlledClosedAccess',
          defaultChecked: formData.alternativeDataSharingPlanControlledOpenAccess === CLOSED_ACCESS,
          onClick: () => updateFormData({
            alternativeDataSharingPlanControlledOpenAccess: CLOSED_ACCESS,
          }),
          description: 'Closed Access',
        }),
      ]),


      div({
        isRendered: formData.alternativeDataSharingPlanControlledOpenAccess === CLOSED_ACCESS,
      },
      [

        // select dac
        label({
          id: 'data_access_committee_header',
          className: 'control-label',
          style: DataSubmitterStyles.header,
        }, ['Data Access Committee*']),

        div({
          style: DataSubmitterStyles.headerDescription
        }, [
          span({}, [
            'Please select which DAC should goverrn requests for this dataset.'
          ]),
        ]),
        h(SearchSelect, {
          id: 'data_submission_select_dac',
          name: 'data_submission_select_dac',
          onSelection: (selection) => updateFormData({
            dataAccessCommitteeId: selection,
          }),
          options: dacs.map((dac) => {
            return { key: dac.dacId, displayText: dac.name };
          }),
          placeholder: 'Search for institution...',
          value: formData.dataAccessCommitteeId,
        }),


        // add consent groupa
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
        consentGroups
          .map((group, idx) => {
            if (isNil(group)) {
              return div({}, []);
            }

            return h(ConsentGroupForm, {
              key: idx.toString() + '_consentGroup',
              idx: idx,
              parentConsentGroup: group,
              saveConsentGroup: (newGroup) => updateConsentGroup(idx, newGroup),
              deleteConsentGroup: () => deleteConsentGroup(idx),
            });
          }

          )]),
    ])
  ]);
};

export default DataAccessGovernance;