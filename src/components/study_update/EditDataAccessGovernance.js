import ConsentGroupForm from '../data_submission/consent_group/ConsentGroupForm';
import { useEffect, useState, useCallback } from 'react';
import { isNil, every, cloneDeep, find } from 'lodash/fp';
import { div, h, h2, a, span } from 'react-hyperscript-helpers';
import { DAC, DAR } from '../../libs/ajax';
import {StudyConsentGroupsUpdate} from './StudyEditConsentGroups';

import '../data_submission/ds_common.css';
import { isEmpty } from 'lodash';

export const DataAccessGovernanceUpdate = (props) => {
  const {
    onChange,
    onFileChange,
    setAllConsentGroupsSaved,
    datasets,
    validation,
    onValidationChange
  } = props;

  const [consentGroupsState, setConsentGroupsState] = useState([]);
  const [dacs, setDacs] = useState([]);
  const [formData, setFormData] = useState({ properties: {}, dataUse: {}, dac: {} });

  const getDiseaseLabels = async (ontologyIds) => {
    let labels = [];
    if (!isEmpty(ontologyIds)) {
      const idList = ontologyIds.join(',');
      const result = await DAR.searchOntologyIdList(idList);
      labels = result.map(r => r.label);
    }
    return labels;
  };

  const normalizeDataUse = useCallback(async (dataUse) => {
    let du = dataUse;
    if (!isNil(dataUse.diseaseRestrictions)) {
      du.hasDiseaseRestrictions = true;
      du.diseaseLabels = await getDiseaseLabels(dataUse.diseaseRestrictions);
    }
    if (!isNil(dataUse.other)) {
      du.hasPrimaryOther = true;
    }
    if (!isNil(dataUse.secondaryOther)) {
      du.hasSecondaryOther = true;
    }
    return du;
  }, []);

  // method to extract consent group data from datasets
  const extract = useCallback((propertyName, dataset) => {
    const property = find({ propertyName })(dataset.properties);
    return property?.propertyValue;
  }, []);

  //extract consent groups from datasets
  const preExistingConsentGroup = useCallback(async (dataset) => {
    // const dac = await DAC.get(dataset?.dacId);
    // const dacs = await DAC.list();
    setFormData({
      datasetId: dataset.datasetId,
      properties: {
        datasetName: extract('Dataset Name', dataset),
        dataLocation: extract('Data Location', dataset),
        fileTypes: extract('File Types', dataset),
        openAccess: extract('Open Access', dataset),
        numberOfParticipants: extract('Number of Participants', dataset)
      },
      dataUse: await normalizeDataUse(dataset?.dataUse),
      // dac: { ...dac, dacs },
    });
  }, [extract, normalizeDataUse]);

  // prefill data
  useEffect(() => {
    datasets?.forEach((dataset) => {
      if(isNil(formData.consentGroupName)){
        preExistingConsentGroup(dataset);
      }
    });
  }, [preExistingConsentGroup, datasets, formData]);

  // pre-populate the page with a consent group
  useEffect(() => {
    addNewConsentGroup();
  }, [addNewConsentGroup]);

  useEffect(() => {
    DAC.list(false).then((dacList) => {
      setDacs(dacList);
    });
  }, [setDacs]);

  useEffect(() => {
    const filteredConsentGroupsState = consentGroupsState.filter(state => !isNil(state));

    const groups = filteredConsentGroupsState.map(state => state.consentGroup);
    const valid = every(filteredConsentGroupsState.map(state => (!state.editMode) && state.valid));

    onChange({ key: 'consentGroups', value: groups, isValid: valid });

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
        key: Math.max(0, ...consentGroupsState.map((state) => state.key)) + 1,
        nihInstitutionalCertificationFile: null,
        editMode: true,
        valid: false,
      });
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

  useEffect(() => {
    setAllConsentGroupsSaved(consentGroupsState.every((state) => state.editMode === false));
  }, [consentGroupsState, setAllConsentGroupsSaved]);

  return div({
    className: 'data-submitter-section',
  }, [
    h2('Data Access Governance'),
    div({},
      [
        // consent groups
        consentGroupsState
          ?.map((state, idx) => {
            if (isNil(state)) {
              return div({}, []);
            }

            return div({ key: state.key },
              [
                h(StudyConsentGroupsUpdate, {
                  formData,
                }),
              ]
            );
          }),
        // add consent group
        div({
          className: 'right-header-section',
          id: 'add-new-consent-group-btn',
          style: {
            display: 'flex',
            alignItems: 'flex-end',
            margin: '2rem 0 2rem 0'
          }
        }, [
          a({
            id: 'btn_addConsentGroup',
            className: 'btn-primary btn-add common-background',
            onClick: () => addNewConsentGroup(),
          }, [
            span({}, ['Add Consent Group'])
          ])
        ]),
      ]),
  ]);
};

export default DataAccessGovernanceUpdate;