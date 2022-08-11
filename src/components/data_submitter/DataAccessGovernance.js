import ConsentGroup from './ConsentGroup';
import { useEffect, useState } from 'react';
import { cloneDeep, isNil } from 'lodash/fp';
import { div, h, a, span} from 'react-hyperscript-helpers';
import SimpleButton from '../SimpleButton';
import { Theme } from '../../libs/theme';
import { DAC } from '../../libs/ajax';
import {SearchSelect} from '../SearchSelect';
import {RadioButton} from '../RadioButton';

const OPEN_ACCESS = "Open Access";
const CLOSED_ACCESS = "Closed Access";


const radioButtonStyle = {
  fontFamily: 'Montserrat',
  fontSize: '14px',
};
const radioContainer = {
  marginTop: '.5rem',
};

export const DataAccessGovernance = (props) => {
  const {
    formData, setFormData
  } = props;

  const [consentGroups, setConsentGroups] = useState([]);
  const [dacs, setDacs] = useState([]);


  const updateFormData = (updatedFields) => {
    setFormData({
      ...formData,
      ...updatedFields,
    });
  };

  useEffect(() => {
    updateFormData({
      consentGroups: consentGroups.filter((val) => !isNil(val)),
    })
  }, [consentGroups]);

  useEffect(() => {
    DAC.list(false).then((dacList) => {
      setDacs(dacList);
    });
  }, [])

  const addNewConsentGroup = () => {
    const newConsentGroups = cloneDeep(consentGroups);
    newConsentGroups.push({});
    setConsentGroups(newConsentGroups)
  };

  const deleteConsentGroup = (idx) => {
    const newConsentGroups = cloneDeep(consentGroups);
    newConsentGroups[idx] = undefined;
    setConsentGroups(newConsentGroups);
  };

  const updateConsentGroup = (idx, update) => {
    const newConsentGroups = cloneDeep(consentGroups);
    newConsentGroups[idx] = {
      ...consentGroups[idx],
      ...update,
    };
    updateFormData({
      consentGroups: newConsentGroups,
    });
  };



  return div({}, [
    div({}, [

      // open or closed access
      div({
        style: radioContainer,
      }, [
        RadioButton({
          style: radioButtonStyle,
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
        style: radioContainer,
      }, [
        RadioButton({
          style: radioButtonStyle,
          id: 'alternativeDataSharingPlanControlledOpenAccess',
          name: 'alternativeDataSharingPlanControlledOpenAccess',
          value: 'alternativeDataSharingPlanControlledOpenAccess',
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
          div({className: 'right-header-section', style: {
            display: 'flex',
            alignItems: 'flex-end'
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

            return h(ConsentGroup, {
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