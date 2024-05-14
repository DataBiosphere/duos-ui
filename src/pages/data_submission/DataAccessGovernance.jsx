import ConsentGroupForm from './consent_group/ConsentGroupForm';
import React, { useEffect, useState, useCallback } from 'react';
import { isNil, every, cloneDeep, isEmpty, find } from 'lodash/fp';
import { DAR } from '../../libs/ajax/DAR';
import { DAC } from '../../libs/ajax/DAC';

import './ds_common.css';

export const DataAccessGovernance = (props) => {
  const {
    onChange,
    studyEditMode,
    onFileChange,
    validation,
    datasets,
    onValidationChange,
    setAllConsentGroupsSaved,
    datasetNames = []
  } = props;

  const [consentGroupsState, setConsentGroupsState] = useState([]);
  const [dacs, setDacs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
      // The disease restriction may not cleanly map to the label
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

  const extractFileTypes = useCallback((propertyName, dataset) => {
    const property = find({ propertyName })(dataset.properties);
    let fileTypes = [];

    property?.propertyValue.forEach((propValue)=> {
      fileTypes = [
        {
          fileType: propValue?.fileType,
          functionalEquivalence: propValue?.functionalEquivalence
        }
      ];
    });
    return fileTypes;
  }, []);

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
        disableFields: false,
      });

      return newConsentGroupsState;
    });
  }, []);

  // extract consent groups from datasets
  const prefillConsentGroups = useCallback(async () => {
    var consentGroups = await Promise.all(datasets?.map(async (dataset, idx) => {
      const dataUse = await normalizeDataUse(dataset?.dataUse);
      const accessManagement = extract('Access Management', dataset);
      const dac = 'dacId' in dataset ? await DAC.get(dataset.dacId) : undefined;

      return {
        consentGroup: {
          datasetId: dataset.dataSetId,
          consentGroupName: dataset.name,

          // primary
          generalResearchUse: dataUse.generalUse,
          hmb: dataUse.hmbResearch,
          diseaseSpecificUse: dataUse.diseaseRestrictions,
          poa: dataUse.populationOriginsAncestry,
          accessManagement: accessManagement,
          otherPrimary: dataUse.other,

          // secondary
          nmds: dataUse.methodsResearch,
          gso: dataUse.geneticStudiesOnly,
          pub: dataUse.publicationResults,
          col: dataUse.collaboratorRequired,
          irb: dataUse.ethicsApprovalRequired,
          gs: dataUse.geographicalRestrictions,
          mor: dataUse.publicationMoratorium,
          npu: dataUse.nonProfitUse,
          otherSecondary: dataUse.secondaryOther,
          url: extract('URL', dataset),
          dataLocation: extract('Data Location', dataset),
          numberOfParticipants: extract('# of participants', dataset),
          fileTypes: extractFileTypes('File Types', dataset),
          dataAccessCommitteeId: dac?.dacId,
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
      setIsLoading(false);
    }
    return consentGroupsState;
  }, [consentGroupsState, datasets, normalizeDataUse, extract, extractFileTypes]);

  // when in edit study mode, pre-populate the page with the study's consent groups otherwise add new
  useEffect(() => {
    const init = async () => {
      if (studyEditMode) {
        if (!isNil(datasets) && isLoading) {
          await prefillConsentGroups();
        }
      } else {
        if (isEmpty(consentGroupsState)) {
          addNewConsentGroup();
        }
      }
    };
    init();
  }, [prefillConsentGroups, addNewConsentGroup, studyEditMode, datasets, consentGroupsState, isLoading]);

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

  return (
    <div className='data-submitter-section'>
      <h2>Data Access Governance</h2>
      <div>
        {consentGroupsState?.map((state, idx) => {
          if (isNil(state)) {
            return <div key={state.key}></div>;
          }
          return (
            <div key={state.key}>
              <ConsentGroupForm
                idx={idx}
                dacs={dacs}
                consentGroupsState={consentGroupsState}
                studyEditMode={studyEditMode}
                disableDelete={consentGroupsState.length === 1}
                saveConsentGroup={(newGroup) => updateConsentGroup(idx, newGroup.value, newGroup.valid)}
                deleteConsentGroup={() => deleteConsentGroup(idx)}
                updateNihInstitutionalCertificationFile={(file) => updateNihInstitutionalCertificationFile(idx, file)}
                startEditConsentGroup={() => startEditConsentGroup(idx)}
                validation={validation?.consentGroups?.at(idx) || {}}
                onValidationChange={(change) => {
                  onValidationChange({ ...change, ...{ key: `consentGroups[${idx}].` + change.key } });
                }}
                datasetNames={datasetNames}
              />
            </div>
          );
        })}

        {/* add consent group */}
        <div className='right-header-section' id='add-new-consent-group-btn' style={{ display: 'flex', alignItems: 'flex-end', margin: '2rem 0 2rem 0' }}>
          <a id='btn_addConsentGroup' className='btn-primary btn-add common-background' onClick={addNewConsentGroup}>
            <span>Add Consent Group</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DataAccessGovernance;
