import ConsentGroupForm from './consent_group/ConsentGroupForm';
import { useEffect, useState, useCallback } from 'react';
import { isNil, every, cloneDeep, isEmpty, find } from 'lodash/fp';
import { div, h, h2, a, span } from 'react-hyperscript-helpers';
import { DAC, DAR } from '../../libs/ajax';

import './ds_common.css';

export const DataAccessGovernance = (props) => {
  const {
    onChange,
    studyEditMode,
    setStudyEditMode,
    onFileChange,
    validation,
    datasets,
    onValidationChange,
    setAllConsentGroupsSaved
  } = props;

  const [consentGroupsState, setConsentGroupsState] = useState([
    // default consent group to test out functionality
    /*
    {
      "consentGroup": {
        "consentGroupName": "hello world",
        "generalResearchUse": false,
        "hmb": false,
        "poa": true,
        "openAccess": false,
        "nmds": true,
        "gso": true,
        "pub": true,
        "col": true,
        "irb": true,
        "gs": "timbuktu",
        "mor": "1970-01-01",
        "npu": true,
        "otherSecondary": "stuff",
        "dataLocation": "Not Determined",
        "numberOfParticipants": 5000,
        "fileTypes": [
          {
            "fileType": "Exome",
            "functionalEquivalence": "gdv"
          }
        ],
        "dataAccessCommitteeId": 43
      },
      "key": 1,
      "nihInstitutionalCertificationFile": null,
      "editMode": false,
      "valid": true
    }
    */
  ]);
  const [dacs, setDacs] = useState([]);

  const [formData, setFormData] = useState([]);

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
  const prefillFormData = useCallback(async (datasets) => {

    //console.log(datasets);
    //console.log(formData);
    /*
    // DAC is required if openAcess is false
    const openAccess = extract('Open Access', dataset);
    const dac = openAccess ? undefined : await DAC.get(dataset?.dacId);
    const dacs = openAccess ? undefined : await DAC.list();

    setFormData({
      datasetId: dataset.datasetId,
      properties: {
        datasetName: extract('Dataset Name', dataset),
        dataLocation: extract('Data Location', dataset),
        dataLocationURL: extract('URL', dataset),
        fileTypes: extract('File Types', dataset),
        openAccess: extract('Open Access', dataset),
        numberOfParticipants: extract('Number of Participants', dataset)
      },
      dataUse: await normalizeDataUse(dataset?.dataUse),
      dac: { ...dac, dacs },
      consentGroupsState: addExistingConsentGroup,
    });
    */
  
  }, [extract, normalizeDataUse, addNewConsentGroup]);

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

  useEffect(() => {
    if(isNil(formData) || formData.length === 0) {
      prefillFormData(datasets);
    }
  }, [prefillFormData, datasets, formData]);

  // pre-populate the page with a consent group
  useEffect(() => {
    // when in edit study mode, pre-populate the page with the study's consent groups
    //prefillConsentGroups(); this method would extract consent groups from datasets
    //pseudocode of this method:
    //prefillConsentGroups = useCallback(async () => {
    // from datasets array to consent group array (needs to match the existing consent group structure)
    // var consentGroups = datasets.map(dataset => {
    //    // extract the consent group data from the dataset
    //    return {
    //        key: <...>,
    //        consentGroup: {
    //            consentGroupName: <...>,
    //            generalResearchUse: <...>,
    //            poa: <...>,
    //        },
    //        nihInstitutionalCertificationFile: <...>
    //    }
    //  }
    // once arrray is created, set the consent group state
    // setConsentGroupsState(consentGroups);
    //}, [datasets]);
    //fill the consent group state with the study's consent groups
    // otherwise add a new consent group
    addNewConsentGroup();
  }, [addNewConsentGroup]);

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
                  consentGroupsState,
                  formData,
                  studyEditMode,
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
            onClick: () => { addNewConsentGroup(); }
            // button could add 1 to the consent group state index
            // look into sychronizing consent groups and formData

          }, [
            span({}, ['Add Consent Group'])
          ])
        ]),
      ]),
  ]);
};

export default DataAccessGovernance;