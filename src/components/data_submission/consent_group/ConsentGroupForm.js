import { useState } from 'react';
import { div, h, span, a, button } from 'react-hyperscript-helpers';
import ConsentGroupSummary from './ConsentGroupSummary';
import { EditConsentGroup } from './EditConsentGroup';
import { computeConsentGroupValidationErrors } from './ConsentGroupErrors';
import { isEmpty, cloneDeep, set } from 'lodash';
import StudyEditConsentGroups from '../../study_update/StudyEditConsentGroups';

export const ConsentGroupForm = (props) => {
  const {
    idx,
    saveConsentGroup,
    updateNihInstitutionalCertificationFile,
    deleteConsentGroup,
    disableDelete,
    dataset,
    studyEditMode,
  } = props;

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
      //nihInstitutionalCertificationFile: dataset.nihInstitutionalCertificationFile,
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

  const [consentGroup, setConsentGroup] = useState({
    consentGroupName: '',

    // primary: one of these needs to be filled
    generalResearchUse: undefined,
    hmb: undefined,
    diseaseSpecificUse: undefined, // string
    poa: undefined,
    openAccess: undefined,
    otherPrimary: undefined, // string

    // secondary:
    nmds: false, // No Methods Development or validation studies
    gso: false, // genetic studies only
    pub: false, // publication required
    col: false, // collaboration required
    irb: false, // irb approval required
    gs: null, // string: geographic restriction
    mor: undefined, // date (string): publication moratorium
    npu: false, // non profit only
    otherSecondary: null, // string

    // dataLocation is one of:
    // "AnVIL Workspace", "Terra Workspace",
    // "TDR Location", "Not Determined"
    dataLocation: null,

    url: '',
    numberOfParticipants: undefined, // numeric
    fileTypes: [{}],
  });

  const [nihInstitutionalCertificationFile, setNihInstitutionalCertificationFile] = useState(null);
  const [validation, setValidation] = useState({});

  const onValidationChange = ({key, validation}) => {
    setValidation((val) => {
      const newValidation = cloneDeep(val);
      set(newValidation, key, validation);
      return newValidation;
    });
  };

  const [editMode, setEditMode] = useState(true);

  return div({
    style: {
      border: '1px solid #283593',
      padding: '1rem 2rem 1rem 2rem',
      borderRadius: '4px',
      marginBottom: '2rem',
    },
    id: idx+'_consentGroupForm'
  }, [

    (studyEditMode
      ? h(StudyEditConsentGroups, {
        saveConsentGroup,
        idx,
        formData,
      })
      : (editMode
        ? h(EditConsentGroup, {
          ...props,
          ...{
            consentGroup: consentGroup,
            setConsentGroup: setConsentGroup,
            nihInstitutionalCertificationFile,
            setNihInstitutionalCertificationFile: (file) => {
              setNihInstitutionalCertificationFile(file);
              updateNihInstitutionalCertificationFile(file);
            },
            validation,
            onValidationChange
          },
        })
        : h(ConsentGroupSummary, {
          ...props,
          ...{consentGroup: consentGroup, id: idx+'_consentGroupSummary', nihInstitutionalCertificationFile},
        }))
    ),
    // save + delete
    div({
      style: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: '2rem',
      }
    }, [
      a({
        id: idx+'_deleteConsentGroup',
        onClick: () => deleteConsentGroup(),
        disabled: disableDelete,
      }, [
        span({
          className: 'cm-icon-button glyphicon glyphicon-trash',
          'aria-hidden': 'true', 'data-tip': 'Delete dataset', 'data-for': 'tip_delete'
        }),
        span({
          style: {
            marginLeft: '1rem',
          }
        }, ['Delete this entry']),
      ]),
      div({}, [
        button({
          id: idx+'_editConsentGroup',
          type: 'button',
          isRendered: !editMode,
          onClick: () => {
            setEditMode(true);
          },
          className: 'f-right btn-primary common-background',
        }, ['Edit']),

        button({
          id: idx+'_saveConsentGroup',
          type: 'button',
          isRendered: editMode,
          onClick: () => {
            const errors = computeConsentGroupValidationErrors(consentGroup);
            const valid = isEmpty(errors);

            setValidation(errors);

            if (valid) {
              saveConsentGroup({ value: consentGroup, valid: true });
              setEditMode(false);
            }
          },
          className: 'f-right btn-primary common-background',
        }, ['Save']),
      ]),
    ])
  ]);
};

export default ConsentGroupForm;