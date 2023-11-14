import { useState } from 'react';
import { div, h, span, a, button } from 'react-hyperscript-helpers';
import ConsentGroupSummary from './ConsentGroupSummary';
import { EditConsentGroup } from './EditConsentGroup';
import { computeConsentGroupValidationErrors } from './ConsentGroupErrors';
import { isEmpty, cloneDeep, set } from 'lodash';

export const ConsentGroupForm = (props) => {
  const {
    idx,
    dacs,
    saveConsentGroup,
    updateNihInstitutionalCertificationFile,
    deleteConsentGroup,
    disableDelete,
    consentGroupsState,
    studyEditMode,
    datasetNames
  } = props;

  const curConsentGroup = consentGroupsState[idx].consentGroup;
  const [consentGroup, setConsentGroup] = useState({
    datasetId: curConsentGroup.datasetId || null,
    consentGroupName: curConsentGroup.consentGroupName || '',

    // access management is one of: "controlled", "open", "external"
    accessManagement: curConsentGroup.accessManagement || undefined, // string

    // primary:
    generalResearchUse: curConsentGroup.generalResearchUse || undefined,
    hmb: curConsentGroup.hmb || undefined,
    diseaseSpecificUse: curConsentGroup.diseaseSpecificUse || undefined, // string
    poa: curConsentGroup.poa || undefined,
    otherPrimary: curConsentGroup.otherPrimary || undefined, // string

    // secondary:
    nmds: curConsentGroup.nmds || false, // No Methods Development or validation studies
    gso: curConsentGroup.gso || false, // genetic studies only
    pub: curConsentGroup.pub || false, // publication required
    col: curConsentGroup.col || false, // collaboration required
    irb: curConsentGroup.irb || false, // irb approval required
    gs: curConsentGroup.gs || null, // string: geographic restriction
    mor: curConsentGroup.mor || undefined, // date (string): publication moratorium
    npu: curConsentGroup.npu || false, // non profit only
    otherSecondary: curConsentGroup.otherSecondary || null, // string

    // dataLocation is one of:
    // "AnVIL Workspace", "Terra Workspace",
    // "TDR Location", "Not Determined"
    dataLocation: curConsentGroup.dataLocation || null,

    url: curConsentGroup.url || '',
    numberOfParticipants: curConsentGroup.numberOfParticipants || undefined, // numeric
    fileTypes: curConsentGroup.fileTypes || [{}],

    dataAccessCommitteeId: curConsentGroup.dataAccessCommitteeId || null, // string
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

  const [editMode, setEditMode] = useState(consentGroupsState[idx].editMode);

  return div({
    style: {
      border: '1px solid #283593',
      padding: '1rem 2rem 1rem 2rem',
      borderRadius: '4px',
      marginBottom: '2rem',
    },
    id: idx+'_consentGroupForm'
  }, [
    (editMode
      ? h(EditConsentGroup, {
        ...props,
        ...{
          consentGroup: consentGroup,
          setConsentGroup: setConsentGroup,
          disableFields: consentGroupsState[idx].disableFields,
          nihInstitutionalCertificationFile,
          setNihInstitutionalCertificationFile: (file) => {
            setNihInstitutionalCertificationFile(file);
            updateNihInstitutionalCertificationFile(file);
          },
          validation,
          onValidationChange,
          dacs
        },
      })
      : h(ConsentGroupSummary, {
        ...props,
        ...{consentGroup: consentGroup, id: idx+'_consentGroupSummary', nihInstitutionalCertificationFile},
      })
    ),
    // save, cancel and delete
    div({
      style: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: '2rem',
      }
    }, [
      a({
        isRendered: !studyEditMode || !consentGroupsState[idx].disableFields,
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
          isRendered: studyEditMode && editMode && consentGroupsState[idx].disableFields,
          className: 'study-edit-form-cancel-button f-left btn',
          type: 'button',
          onClick: () => setEditMode(false),
        }, ['Cancel']),
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
            const errors = computeConsentGroupValidationErrors(consentGroup, datasetNames);
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
