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
    onFileChange,
    validation,
    datasets,
    onValidationChange,
    setAllConsentGroupsSaved
  } = props;

  const [consentGroupsState, setConsentGroupsState] = useState([]);
  const [dacs, setDacs] = useState([]);

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
      try {
        du.diseaseLabels = await getDiseaseLabels(dataUse.diseaseRestrictions);
      } catch {
        // do nothing
      }

    }
    if (!isNil(dataUse.other)) {
      du.hasPrimaryOther = true;
    }
    if (!isNil(dataUse.secondaryOther)) {
      du.hasSecondaryOther = true;
    }
    return du;
  }, []);

  const extractFileTypes = useCallback((propertyName, fileTypesName, dataset) => {
    const property = find({ propertyName })(dataset.properties);

    const fileTypesArr = [];
    const idx = 0;

    property?.propertyValue.forEach(()=> {
      fileTypesName === 'fileType' ?
        fileTypesArr.push(property.propertyValue[idx]?.fileType)
        : fileTypesArr.push(property.propertyValue[idx]?.functionalEquivalence);
    });
    return fileTypesArr;
  }, []);

  // method to extract consent group data from datasets
  const extract = useCallback((propertyName, dataset) => {
    const property = find({ propertyName })(dataset.properties);
    return property?.propertyValue;
  }, []);

  useEffect(() => {
    DAC.list(false).then((dacList) => {
      setDacs(dacList);
    });
  }, [setDacs]);

  useEffect(() => {
    const filteredConsentGroupsState = consentGroupsState?.filter(state => !isNil(state));

    const groups = filteredConsentGroupsState?.map(state => state.consentGroup);
    const valid = every(filteredConsentGroupsState?.map(state => (!state.editMode) && state.valid));

    onChange({ key: 'consentGroups', value: groups, isValid: valid });

    filteredConsentGroupsState?.forEach((cgState, idx) => {
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
      newConsentGroupsState?.push({
        consentGroup: {},
        key: Math.max(0, ...consentGroupsState.map((state) => state.key)) + 1,
        nihInstitutionalCertificationFile: null,
        editMode: true,
        valid: false,
        disableFields: false,
      });

      return newConsentGroupsState;
    });
  }, []);

  // extract consent groups from datasets
  const prefillConsentGroups = useCallback(async () => {
    // from datasets array to consent group array (needs to match the existing consent group structure)
    var consentGroups = await Promise.all(datasets?.map(async (dataset, idx) => {
      const dataUse = await normalizeDataUse(dataset?.dataUse);
      // DAC is required if openAcess is false
      const openAccess = extract('Open Access', dataset);
      const dac = openAccess ? undefined : await DAC.get(dataset?.dacId);
      const dacs = openAccess ? undefined : await DAC.list();

      // extract the consent group data from the dataset
      return {
        consentGroup: {
          consentGroupName: dataset.datasetName,

          // primary
          generalResearchUse: dataUse.generalUse,
          hmb: dataUse.hmbResearch,
          diseaseSpecificUse: dataUse.diseaseRestrictions,
          poa: dataUse.populationOriginsAncestry,
          openAccess: openAccess,
          otherPrimary: dataUse.other,

          // secondary
          nmds: dataUse.methodsResearch,
          gso: dataUse.geneticStudiesOnly,
          pub: dataUse.publicationResults,
          col: dataUse.collaboratorRequired,
          irb: dataUse.ethicsApprovalRequired,
          gs: dataUse.geographicalRestrictions,
          mor: dataUse.publicationMoratorium,
          npu: dataUse.commercialUse,
          otherSecondary: dataUse.secondaryOther,
          url: extract('URL', dataset),
          dataLocation: extract('Data Location', dataset),
          numberOfParticipants: extract('Number Of Participants', dataset),
          fileTypes: [
            {
              fileType: extractFileTypes('File Types', 'fileType', dataset),
              functionalEquivalence: extractFileTypes('File Types', 'functionalEquivalence', dataset)
            }
          ],
          dataAccessCommitteeId: { ...dac, dacs },
        },
        key: `prefilledConsentGroups[${idx}]`,
        nihInstitutionalCertificationFile: null,
        editMode: false,
        valid: false,
        disableFields: true,
      };
    }));
    if (isEmpty(consentGroupsState)) {
      setConsentGroupsState(consentGroups);
    }
    return consentGroupsState;
  }, [consentGroupsState, datasets, normalizeDataUse, extract, extractFileTypes]);

  // pre-populate the page with a consent group
  useEffect(() => {
    // when in edit study mode, pre-populate the page with the study's consent groups otherwise add new
    const init = async () => {
      if (studyEditMode) {
        if (!isNil(datasets)) {
          await prefillConsentGroups();
        }
      } else {
        if (isEmpty(consentGroupsState)) {
          addNewConsentGroup();
        }
      }
    };
    init();
  }, [prefillConsentGroups, addNewConsentGroup, studyEditMode, datasets, consentGroupsState]);

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
    setAllConsentGroupsSaved(consentGroupsState?.every((state) => state.editMode === false));
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
          }, [
            span({}, ['Add Consent Group'])
          ])
        ]),
      ]),
  ]);
};

export default DataAccessGovernance;