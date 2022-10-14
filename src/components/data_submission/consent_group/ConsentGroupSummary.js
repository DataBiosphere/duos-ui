import { div, input, span, p } from 'react-hyperscript-helpers';
import { isNil, isString, isArray } from 'lodash/fp';


const primaryConsentText = {
  generalResearchUse: 'General Research Use',
  hmb: 'Health/Medical/Biomedical Research Use',
  diseaseSpecificUse: 'Disease-Specific Research Use',
  poa: 'Populations, Origins, Ancestry Use',
  otherPrimary: 'Other',
};

const secondaryConsentText = {
  nmds: 'No Methods Development or validation studies (NMDS)',
  gso: 'Genetic studies only (GSO)',
  pub: 'Publication Required (PUB)',
  col: 'Collaboration Required (COL)',
  irb: 'Ethics Approval Required (IRB)',
  gs: 'Geographic Restriction (GS-)',
  mor: 'Publication Moratorium (MOR)',
  npu: 'Non-profit Use Only (NPU)',
  otherSecondary: 'Other',

};

// returns { field: string, value: ? } or undefined
// field is 'set' if it is a boolean and is true
// or if there is any non-boolean value present.
const findFirstSetField = (obj, fields) => {
  for (const i in fields) {
    const field = fields[i];
    if (!isNil(obj[field]) && obj[field] !== false) {
      return field;
    }
  }
  return undefined;
};

const findAllSetFields = (obj, fields) => {
  const setFields = [];

  for (const i in fields) {
    const field = fields[i];
    if (!isNil(obj[field]) && obj[field] !== false) {
      setFields.push(field);
    }
  }
  return setFields;
};

const primaryConsentFields = [
  'generalResearchUse',
  'hmb',
  'diseaseSpecificUse',
  'poa',
  'otherPrimary',
];

const secondaryConsentFields = [
  'nmds',
  'gso',
  'pub',
  'col',
  'irb',
  'gs',
  'mor',
  'npu',
  'otherSecondary',
];

export const ConsentGroupSummary = (props) => {
  const {
    consentGroup,
    id
  } = props;

  const summarizePrimaryGroup = () => {
    const field = findFirstSetField(consentGroup, primaryConsentFields);

    if (isNil(field)) {
      return 'No selection.';
    }

    const value = consentGroup[field];

    if (isString(value)) {
      return div({}, [
        span({}, [primaryConsentText[field] + ': ']),
        span({
          style: {
            fontStyle: 'italic',
          }
        }, [value])
      ]);
    }

    if (isArray(value)) {
      return div({}, [
        span({}, [primaryConsentText[field] + ': ']),
        span({
          style: {
            fontStyle: 'italic',
          }
        }, [value.join(', ')])
      ]);
    }

    return p({}, [primaryConsentText[field]]);
  };

  const summarizeSecondaryGroup = () => {
    const fields = findAllSetFields(consentGroup, secondaryConsentFields);

    if (fields.length === 0) {
      return 'None selected.';
    }


    return fields.map((field, idx) => {
      const value = consentGroup[field];
      const text = secondaryConsentText[field];

      if (isString(value)) {
        return div({
          key: `secondaryGroup_${idx}`,
          style: {
            marginBottom: '3px',
          }
        },
        [
          span({}, [text + ': ']),
          span({
            style: {
              fontStyle: 'italic',
            },
          }, [value]),
        ]);
      }

      return p({
        key: `secondaryGroup_${idx}`,
      }, text);
    });

  };

  return div({}, [
    div({
      id: id,
      style: {
        display: 'flex',
        justifyContent: 'space-around',
        margin: '1.5rem 0 1.5rem 0',
      }
    }, [

      div({
        style: {
          flex: '1 1 100%',
          marginRight: '1.5rem',
        }
      }, [
        p({
          style: {
            fontWeight: 'bold',
            fontSize: '16px',
          }
        }, ['Name']),
        input({
          disabled: true,
          type: 'text',
          className: 'form-control',
          value: consentGroup.consentGroupName,
        }),
        p({
          style: {
            fontWeight: 'bold',
            fontSize: '16px',
          }
        }, ['Primary Group']),
        summarizePrimaryGroup(),
        p({
          style: {
            fontWeight: 'bold',
            fontSize: '16px',
          }
        }, ['Secondary Group(s)']),
        summarizeSecondaryGroup(),
      ]),

      div({
        style: {
          flex: '1 1 100%',
        }
      }, [
        p({
          style: {
            fontWeight: 'bold',
            fontSize: '16px',
          }
        }, ['Data Location']),
        p({}, [
          (!isNil(consentGroup.dataLocation)? consentGroup.dataLocation.join(', ') : ''),
        ]),
        input({
          disabled: true,
          type: 'text',
          className: 'form-control',
          value: consentGroup.url,
        }),
        p({
          style: {
            fontWeight: 'bold',
            fontSize: '16px',
          }
        }, ['File Types']),
        div({}, consentGroup.fileTypes.map((ft, idx) => p({
          key: idx,
          style: {
            marginBottom: '20px',
          }
        }, [
          p({}, ['File Type: ', span({style: {fontStyle: 'italic'}}, [`${ft.fileType}`])]),
          p({}, ['Functional Equivalence: ', span({style: {fontStyle: 'italic'}}, [`${ft.functionalEquivalence}`])]),
          p({}, ['# of Participants: ', span({style: {fontStyle: 'italic'}}, [`${ft.numberOfParticipants}`])]),
        ]))),
      ]),
    ]),
  ]);
};

export default ConsentGroupSummary;