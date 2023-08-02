import { useState } from 'react';
import { div, h, span, a, button } from 'react-hyperscript-helpers';
import ConsentGroupSummary from './ConsentGroupSummary';
import { EditConsentGroup } from './EditConsentGroup';
import { computeConsentGroupValidationErrors } from './ConsentGroupErrors';
import { isEmpty, cloneDeep, set } from 'lodash';

export const ConsentGroupForm = (props) => {
  const {
    idx,
    saveConsentGroup,
    updateNihInstitutionalCertificationFile,
    deleteConsentGroup,
    disableDelete,
    consentGroupsState,
    studyEditMode
  } = props;

  const [consentGroup, setConsentGroup] = useState({
    // this will need to change to studyEditMode ? <consentGroupsState property> : <default>
    consentGroupName: consentGroupsState[idx].consentGroup.consentGroupName || '',

    // primary: one of these needs to be filled
    // if in edit study mode, give each of these the value of the consent group state at the index
    // otherwise give them the default value
    generalResearchUse: consentGroupsState[idx].consentGroup.generalResearchUse || undefined,
    hmb: consentGroupsState[idx].consentGroup.hmb || undefined,
    diseaseSpecificUse: consentGroupsState[idx].consentGroup.diseaseSpecificUse || undefined, // string
    poa: consentGroupsState[idx].consentGroup.poa || undefined,
    openAccess: consentGroupsState[idx].consentGroup.openAccess || undefined,
    otherPrimary: consentGroupsState[idx].consentGroup.otherPrimary || undefined, // string

    // secondary:
    nmds: consentGroupsState[idx].consentGroup.nmds || false, // No Methods Development or validation studies
    gso: consentGroupsState[idx].consentGroup.gso || false, // genetic studies only
    pub: consentGroupsState[idx].consentGroup.pub || false, // publication required
    col: consentGroupsState[idx].consentGroup.col || false, // collaboration required
    irb: consentGroupsState[idx].consentGroup.irb || false, // irb approval required
    gs: consentGroupsState[idx].consentGroup.gs || null, // string: geographic restriction
    mor: consentGroupsState[idx].consentGroup.mor || undefined, // date (string): publication moratorium
    npu: consentGroupsState[idx].consentGroup.npu || false, // non profit only
    otherSecondary: consentGroupsState[idx].consentGroup.otherSecondary || null, // string

    // dataLocation is one of:
    // "AnVIL Workspace", "Terra Workspace",
    // "TDR Location", "Not Determined"
    dataLocation: consentGroupsState[idx].consentGroup.dataLocation || null,

    url: consentGroupsState[idx].consentGroup.url || '',
    numberOfParticipants: consentGroupsState[idx].consentGroup.numberOfParticipants || undefined, // numeric
    fileTypes: consentGroupsState[idx].consentGroup.fileTypes || [{}],

    dataAccessCommitteeId: consentGroupsState[idx].consentGroup.dataAccessCommitteeId || null, // string
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
          studyEditMode,
          validation,
          onValidationChange,
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