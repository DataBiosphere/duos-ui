import { div, input, span, p } from 'react-hyperscript-helpers';
import { isNil } from 'lodash/fp';


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

  const primaryGroupHtml = () => {
    const field = findFirstSetField(consentGroup, primaryConsentFields);

    if (isNil(field)) {
      return 'No selection.';
    }

    const value = consentGroup[field];

    if (typeof value == 'string' || value instanceof String) {
      return div({}, [
        span({}, [primaryConsentText[field] + ': ']),
        span({
          style: {
            fontStyle: 'italic',
          }
        }, [value])
      ]);
    }

    return p({}, [primaryConsentText[field]]);
  };

  const secondaryGroupHtml = () => {
    const fields = findAllSetFields(consentGroup, secondaryConsentFields);

    if (fields.length === 0) {
      return 'None selected.';
    }


    return fields.map((field) => {
      const value = consentGroup[field];
      const text = secondaryConsentText[field];

      if (typeof value == 'string' || value instanceof String) {
        return div({
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

      return p({}, text);
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
          disabled: 'true',
          type: 'text',
          className: 'form-control',
          value: consentGroup.consentGroupName,
        }),
      ]),

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
        }, ['Primary Group']),
        primaryGroupHtml(),
      ]),

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
        }, ['Secondary Group(s)']),
        secondaryGroupHtml(),
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
          disabled: 'true',
          type: 'text',
          className: 'form-control',
          value: consentGroup.url,
        }),
      ]),
    ]),
  ]);
};

export default ConsentGroupSummary;