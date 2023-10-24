import {Styles} from '../libs/theme';
import {a, br, button, div, h, input, label, span, textarea} from 'react-hyperscript-helpers';
import {RadioButton} from '../components/RadioButton';
import AsyncSelect from 'react-select/async';
import {isNil, isEmpty, head} from 'lodash/fp';
import {Notifications, searchOntologies} from '../libs/utils';
import {DataUseTranslation} from '../libs/dataUseTranslation';
import {useState} from 'react';

const buttonStyle = { marginBottom: '2rem', color: '#777' };
const labelStyle = { fontFamily: 'Montserrat', fontSize: '15px' };

export default function ConsentTextGenerator() {
  const [general, setGeneral] = useState(false);
  const [hmb, setHmb] = useState(false);
  const [diseases, setDiseases] = useState(false);
  const [ontologies, setOntologies] = useState([]);
  const [other, setOther] = useState(false);
  const [otherText, setOtherText] = useState('');
  const [nmds, setNmds] = useState(false);
  const [gso, setGso] = useState(false);
  const [pub, setPub] = useState(false);
  const [col, setCol] = useState(false);
  const [irb, setIrb] = useState(false);
  const [gs, setGs] = useState(false);
  const [npu, setNpu] = useState(false);
  const [sdsl, setSdsl] = useState('');

  const isTypeOfResearchValid = () => {
    return (general || hmb || (diseases && (!isNil(head(ontologies)))) || (other && (!isEmpty(otherText))));
  };

  const clearOtherTextBox = () => {
    document.getElementById('other_text').value = '';
  };

  const generate = () => {
    isTypeOfResearchValid() ?
      generateHelper()
      : Notifications.showError({text: 'Please complete question 1'});
  };

  const generateHelper = async () => {
    const dataUse = {
      generalUse: general, diseaseRestrictions: ontologies, populationOriginsAncestry: null,
      hmbResearch: hmb, methodsResearch: nmds, geneticStudiesOnly: gso, commercialUse: npu,
      publicationResults: pub, collaboratorRequired: col, ethicsApprovalRequired: irb,
      geographicalRestrictions: gs
    };
    let sdsl = [];
    if (other) {
      sdsl.push(otherText);
    }
    let translatedDataUse = await DataUseTranslation.translateDataUseRestrictions(dataUse);
    translatedDataUse.forEach((sentence) => {
      return (typeof sentence === 'object') ?
        sdsl.push(' ' + sentence.description)
        : sdsl.push(' ' + sentence);
    });
    setSdsl(sdsl);
  };

  return (
    div({style: {...Styles.PAGE, color: '#1f3b50' }}, [
      div({style: {...Styles.TITLE, marginTop: '3.5rem'}}, [
        'Consent Text Generator'
      ]),
      div({style: {...Styles.SMALL, marginTop: '1rem'}}, [
        'This tool is made publicly available by the DUOS team for anyone' +
        ' interested in leveraging standardized data sharing language in their' +
        ' consent forms. The tool leverages the Global Alliance for Genomics ' +
        'and Health’s (GA4GH) companion standards of the ',
        a({href: 'https://github.com/EBISPOT/DUO' , target:'_blank', rel:'noopener noreferrer'
        }, ['Data Use Ontology (DUO)']),
        ' and ',
        a({href: 'https://drive.google.com/file/d/102_I0_phOGs9YSmPx7It9CSt1sHFJ87C/view', target: '_blank', rel: 'noreferrer noopener'
        }, ['Machine Readable Consent Guidance (MRCG)']),
        '. The DUO is a structured vocabulary describing permitted data uses and ' +
        'the MRCG is a suggested representation of those uses in consent form language. ' +
        'This tool enables users to easily define what types of data use they would ' +
        'like permitted in their consent forms and then suggests corresponding text ' +
        'for the consent form below, based on the MRCG.'
      ]),
      div({className: 'form-group', style: {marginTop: '1rem'}}, [
        label({style: Styles.MEDIUM}, [
          '1. Permitted data uses', br(),
          span({style: Styles.MEDIUM_DESCRIPTION}, ['Determine what type of secondary use is permitted for you study\'s data.']),
        ]),
        div({}, [
          RadioButton({
            value: 'general',
            defaultChecked: general,
            onClick: () => {
              setGeneral(true), setHmb(false), setDiseases(false), setOther(false), setOntologies([]), clearOtherTextBox();
            },
            label: 'General Research Use (GRU): ',
            description: 'use is permitted for any research purpose',
            style: { fontFamily: 'Montserrat', color: '#1f3b50'}
          }),

          RadioButton({
            value: 'hmb',
            defaultChecked: hmb,
            onClick: () => {
              setHmb(true), setGeneral(false), setDiseases(false), setOther(false), setOntologies([]), clearOtherTextBox();
            },
            label: 'Health/Medical/Biomedical Use (HMB): ',
            description: 'use is permitted for any health, medical, or biomedical purpose',
            style: { fontFamily: 'Montserrat', color: '#1f3b50'}
          }),

          RadioButton({
            value: 'diseases',
            defaultChecked: diseases,
            onClick: () => {
              setDiseases(true), setHmb(false), setGeneral(false), setOther(false), clearOtherTextBox();
            },
            label: 'Disease-related studies (DS): ',
            description: 'use is permitted for research on the specified disease',
            style: { fontFamily: 'Montserrat', color: '#1f3b50'}
          }),

          div({
            style: {buttonStyle, marginBottom: '10px', cursor: diseases ? 'pointer' : 'not-allowed'},
          }, [
            h(AsyncSelect, {
              isDisabled: !diseases,
              isMulti: true,
              loadOptions: (query, callback) => searchOntologies(query, callback),
              onChange: (option) => option ? setOntologies(option) : setOntologies,
              value: ontologies,
              placeholder: 'Please enter one or more diseases',
              classNamePrefix: 'select',
            }),
          ]),

          RadioButton({
            value: 'other',
            defaultChecked: other,
            onClick: () => {
              setOther(true), setHmb(false), setDiseases(false), setGeneral(false), setOntologies([]);
            },
            label: 'Other Use: ',
            description: 'permitted research use is defined as follows: ',
            style: { fontFamily: 'Montserrat', color: '#1f3b50'}
          }),

          textarea({
            className: 'form-control',
            onBlur: (e) => setOtherText(e.target.value),
            maxLength: '512',
            rows: '2',
            required: other,
            disabled: !other,
            id: 'other_text',
            placeholder: 'Please specify if selected (max. 512 characters)',
          }),
        ]),
      ]),

      div({className: 'form-group', style: {marginTop: '2rem'}}, [
        label({style: {...Styles.MEDIUM, marginBottom: '5px'}}, [
          '2. Additional constraints', br(),
          span({style: Styles.MEDIUM_DESCRIPTION}, ['If necessary, choose any additional terms on your study\'s data to govern its use.']),
        ]),

        div({}, [
          div({className: 'checkbox'}, [
            input({
              checked: nmds,
              onChange: (e) => setNmds(e.target.checked),
              id: 'checkNMDS',
              type: 'checkbox',
            }),
            label({
              style: labelStyle,
              className: 'regular-checkbox',
              htmlFor: 'checkNMDS',
            }, ['No methods development or validation studies (NMDS)']),
          ]),

          div({className: 'checkbox'}, [
            input({
              checked: gso,
              onChange: (e) => setGso(e.target.checked),
              id: 'checkGSO',
              type: 'checkbox',
            }),
            label({
              style: labelStyle,
              className: 'regular-checkbox',
              htmlFor: 'checkGSO',
            }, ['Genetic Studies Only (GSO)']),
          ]),

          div({className: 'checkbox'}, [
            input({
              checked: pub,
              onChange: (e) => setPub(e.target.checked),
              id: 'checkPUB',
              type: 'checkbox',
            }),
            label({
              style: labelStyle,
              className: 'regular-checkbox',
              htmlFor: 'checkPUB',
            }, ['Publication Required (PUB)']),
          ]),

          div({className: 'checkbox'}, [
            input({
              checked: col,
              onChange: (e) => setCol(e.target.checked),
              id: 'checkCOL',
              type: 'checkbox',
            }),
            label({
              style: labelStyle,
              className: 'regular-checkbox',
              htmlFor: 'checkCOL',
            }, ['Collaboration Required (COL)']),
          ]),

          div({className: 'checkbox'}, [
            input({
              checked: irb,
              onChange: (e) => setIrb(e.target.checked),
              id: 'checkIRB',
              type: 'checkbox',
            }),
            label({
              style: labelStyle,
              className: 'regular-checkbox',
              htmlFor: 'checkIRB',
            }, ['Ethics Approval Required (IRB)']),
          ]),

          div({className: 'checkbox'}, [
            input({
              checked: gs,
              onChange: (e) => setGs(e.target.checked),
              id: 'checkGS',
              type: 'checkbox',
            }),
            label({
              style: labelStyle,
              className: 'regular-checkbox',
              htmlFor: 'checkGS',
            }, ['Geographic Restriction (GS-)']),
          ]),

          div({className: 'checkbox'}, [
            input({
              checked: npu,
              onChange: (e) => setNpu(e.target.checked),
              id: 'checkNPU',
              type: 'checkbox',
            }),
            label({
              style: labelStyle,
              className: 'regular-checkbox',
              htmlFor: 'checkNPU',
            }, ['Non-Profit Use Only (NPU)']),
          ])
        ])
      ]),

      button({
        style: {...Styles.TABLE.TABLE_TEXT_BUTTON, marginBottom: '2rem'},
        className: 'button',
        onClick: () => generate(),
      }, ['Generate']),

      textarea({
        defaultValue: sdsl,
        className: 'form-control',
        rows: '12',
        required: false,
        readOnly: true,
        style: {backgroundColor: '#fff'}
      }),

      div({style: {marginBottom: '2rem'}})

    ])
  );
}
