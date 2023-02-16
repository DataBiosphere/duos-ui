import { useState } from 'react';
import { div, h, span, a, button } from 'react-hyperscript-helpers';
import ConsentGroupSummary from './ConsentGroupSummary';
import { EditConsentGroup } from './EditConsentGroup';
import { computeConsentGroupValidationErrors, ConsentGroupErrors } from './ConsentGroupErrors';

export const ConsentGroupForm = (props) => {
  const {
    idx,
    saveConsentGroup,
    updateNihInstitutionalCertificationFile,
    deleteConsentGroup,
    validation,
    onValidationChange
  } = props;

  const [consentGroup, setConsentGroup] = useState({
    consentGroupName: '',

    // primary: one of these needs to be filled
    generalResearchUse: undefined,
    hmb: undefined,
    diseaseSpecificUse: undefined, // string
    poa: undefined,
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
    dataLocation: [],

    url: '',
    fileTypes: [{}],
  });



  const [nihInstitutionalCertificationFile, setNihInstitutionalCertificationFile] = useState(null);
  const [consentGroupValidationErrors, setConsentGroupValidationErrors] = useState([]);
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

    h(ConsentGroupErrors,
      {
        errors: consentGroupValidationErrors,
      }),

    (editMode
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
      })),

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
            const valid = errors.length === 0;

            setConsentGroupValidationErrors(errors);

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