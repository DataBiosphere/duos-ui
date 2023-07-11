import ConsentGroupForm from '../data_submission/consent_group/ConsentGroupForm';
import { useEffect, useState, useCallback } from 'react';
import { isNil, every, cloneDeep} from 'lodash/fp';
import { div, h, h2, a, span } from 'react-hyperscript-helpers';
import { DAC, DAR } from '../../libs/ajax';

import '../data_submission/ds_common.css';

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
  const [formData, setFormData] = useState({ dac: {}, dataUse: {}, properties: {} });

  const searchOntologies = async (query, callback) => {
    let options = [];
    await DAR.getAutoCompleteOT(query).then(
      items => {
        options = items.map((item) => {
          return item.label;
        });
        callback(options);
      });
  };

  const getDiseaseLabels = async (ontologyIds) => {
    let labels = [];
    if (!isNil(ontologyIds)) {
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
  const extract = useCallback((propertyName) => {
    const property = find({ propertyName })(datasets.properties);
    return property?.propertyValue;
  }, [datasets]);

  //extract consent groups from datasets
  const preExistingConsentGroup = useCallback(async (dataset) => {
    const dac = await DAC.get(dataset?.dacId);
    const dacs = await DAC.list();
    setFormData({
      consentGroupName: dataset.name,
      datasetId: dataset.datasetId,
      propeties: {
        dataLocation: extract('Data Location'),
      },
      dataUse: await normalizeDataUse(dataset?.dataUse),
      dac: { ...dac, dacs }
    });
  }, [extract]);

  // pre-populate the page with a consent group
  useEffect(() => {
    prefillConsentGroup();
  }, [prefillConsentGroup]);

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

  const prefillConsentGroup = useCallback(() => {
    setConsentGroupsState((consentGroupsState) => {
      const newConsentGroupsState = cloneDeep(consentGroupsState);
      newConsentGroupsState.push({
        consentGroup: preExistingConsentGroup,
        key: Math.max(0, ...consentGroupsState.map((state) => state.key)) + 1,
        nihInstitutionalCertificationFile: null,
        editMode: true,
        valid: false,
      });
      return newConsentGroupsState;
    });
  }, []);

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

  const deleteConsentGroup = useCallback((idx) => {
    setConsentGroupsState((consentGroupsState) => {
      const newConsentGroupsState = cloneDeep(consentGroupsState);
      newConsentGroupsState.splice(idx, 1);
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
                h(ConsentGroupForm, {
                  idx: idx,
                  dacs: dacs,
                  disableDelete: consentGroupsState.length === 1,
                  saveConsentGroup: (newGroup) => updateConsentGroup(idx, newGroup.value, newGroup.valid),
                  deleteConsentGroup: () => deleteConsentGroup(idx),
                  updateNihInstitutionalCertificationFile: (file) => updateNihInstitutionalCertificationFile(idx, file),
                  startEditConsentGroup: () => startEditConsentGroup(idx),
                  validation: validation?.consentGroups?.at(idx) || {},
                  onValidationChange: (change) => {
                    onValidationChange({ ...change, ...{ key: `consentGroups[${idx}].` + change.key } });
                  }
                })
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