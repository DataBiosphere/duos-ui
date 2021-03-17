import {useEffect, useState} from "react";
import {Styles} from "../libs/theme";
import {br, button, div, h, input, label, span, textarea} from "react-hyperscript-helpers";
import {RadioButton} from "../components/RadioButton";
import AsyncSelect from "react-select/async/dist/react-select.esm";
import {isNil} from "lodash/fp";

const buttonStyle = { marginBottom: '2rem', color: '#777' };

export default function DataSharingLanguageTool(props) {
  const [general, setGeneral] = useState();
  const [hmb, setHmb] = useState();
  const [diseases, setDiseases] = useState();
  const [other, setOther] = useState();
  const [otherText, setOtherText] = useState();
  const [nmds, setNmds] = useState();
  const [gso, setGso] = useState();
  const [pub, setPub] = useState();
  const [col, setCol] = useState();
  const [irb, setIrb] = useState();
  const [gs, setGs] = useState();
  const [mor, setMor] = useState();
  const [npu, setNpu] = useState();
  const [npoa, setNpoa] = useState();
  const [secOther, setSecOther] = useState();
  const [secOtherText, setSecOtherText] = useState();

  useEffect();

  const handleCheckboxChange = (e) => {
    const field = e.target.name;
    const value = e.target.checked;
    this.setState(prev => {
      prev[field] = value;
      return prev;
    });
  };

  const isTypeOfResearchInvalid = () => {
    return general || hmb || !isNil(diseases) || other;
  };

  const setSDSLText = () => {};

  const generate = () => {};

  return (
    div({style: Styles.PAGE}, [
      div({style: Styles.HEADER_CONTAINER}, [
        "Standardized Data Sharing Language Tool"
      ]),
      div({}, [
        "This tool is made publicly available by the DUOS team for anyone" +
        " interested in leveraging standardized data sharing language in their" +
        " consent forms. The tool leverages the Global Alliance for Genomics " +
        "and Health’s (GA4GH) companion standards of the Data Use Ontology (DUO) " +
        "and Machine Readable Consent Guidance (MRCG). The DUO is a structured " +
        "vocabulary describing permitted data uses and the MRCG is a suggested " +
        "representation of those uses in consent form language. This tool enables" +
        " users to easily define what types of data use they would like permitted" +
        " in their consent forms and then suggests corresponding text for the " +
        "consent form below, based on the MRCG."
      ]),
      div({className: 'form-group'}, [
        div(
          {className: 'col-xs-12 rp-group'},
          [
            span({className: 'control-label rp-title-question'}, [
              '1. Choose the permitted data uses for your study\'s data',
              span({},
                ['First, you must determine what type of secondary use is permitted for you study\'s data.' +
                ' You do this by selecting one of the options in the following section:']),
              div({
                style: {'marginLeft': '15px'},
                className: 'row'
              }, [
                span({
                  className: 'cancel-color required-field-error-span',
                  isRendered: isTypeOfResearchInvalid
                }, [
                  'One of the following fields is required.', br(),
                  'Disease related studies require a disease selection.', br(),
                  'Other studies require additional details.'])
              ]),

              div({className: 'col-xs-12'}, [
                RadioButton({
                    style: { buttonStyle },
                    value: 'general',
                    defaultChecked: general,
                    onClick: () => setGeneral(!general),
                    label: 'General Research Use: ',
                    description: 'use is permitted for any research purpose',
                  }),

                  RadioButton({
                    style: { buttonStyle },
                    value: 'hmb',
                    defaultChecked: hmb,
                    onClick: () => setHmb(!hmb),
                    label: 'Health/Medical/Biomedical Use: ',
                    description: 'use is permitted for any health, medical, or biomedical purpose',
                  }),

                  RadioButton({
                    style: { buttonStyle },
                    value: 'diseases',
                    defaultChecked: diseases,
                    onClick: () => setDiseases(!diseases),
                    label: 'Disease-related studies: ',
                    description: 'use is permitted for research on the specified disease',
                  }),
                  div({
                    style: {buttonStyle,
                      cursor: diseases ? 'pointer' : 'not-allowed',
                    },
                  }, [
                    h(AsyncSelect, {
                      id: 'sel_diseases',
                      isDisabled: !diseases,
                      isMulti: true,
                      loadOptions: (query, callback) => this.searchOntologies(query, callback),
                      onChange: (option) => this.onOntologiesChange(option),
                      //value: ontologies,
                      placeholder: 'Please enter one or more diseases',
                      classNamePrefix: 'select',
                    }),
                  ]),

                  RadioButton({
                    style: { buttonStyle },
                    value: 'other',
                    defaultChecked: other,
                    onClick: () => setOther(true),
                    label: 'Other Use:',
                    description: 'permitted research use is defined as follows: ',
                  }),

                  textarea({
                    className: 'form-control',
                    onBlur: (e) => setOtherText(e),
                    maxLength: '512',
                    rows: '2',
                    required: other,
                    placeholder: 'Please specify if selected (max. 512 characters)',
                  }),
                ]),

              div({className: 'form-group'}, [
                div(
                  {className: ' col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question'}, [
                        '2. Choose any additional constraints you need to put on future uses of your data',
                        span({}, ['Then if necessary, you may choose additional terms on your study\'s data to govern it\'s use by adding requirements or limitations.']),
                      ]),
                  ]),
              ]),

              div(
                {className: 'col-xs-12 rp-group'}, [
                  div({className: 'checkbox'}, [
                    input({
                      checked: nmds,
                      onChange: () => handleCheckboxChange,
                      className: 'checkbox-inline rp-checkbox',
                      name: 'nmds'
                    }),
                    label({
                      className: 'regular-checkbox rp-choice-questions',
                      htmlFor: 'checkMethods',
                    }, [
                      span({className: 'access-color'},
                        ['No methods development or validation studies (NMDS)']),
                    ]),
                  ]),
                ]),

              div(
                {className: 'col-xs-12 rp-group'}, [
                  div({className: 'checkbox'}, [
                    input({
                      checked: gso,
                      onChange: () => handleCheckboxChange,
                      className: 'checkbox-inline rp-checkbox',
                      name: 'gso',
                    }),
                    label({
                      className: 'regular-checkbox rp-choice-questions',
                      htmlFor: 'checkGenetic',
                    }, [
                      span({className: 'access-color'},
                        ['Genetic Studies Only (GSO)']),
                    ]),
                  ]),
                ]),

              div(
                {className: 'col-xs-12 rp-group'}, [
                  div({className: 'checkbox'}, [
                    input({
                      checked: pub,
                      onChange: () => handleCheckboxChange,
                      type: 'checkbox',
                      className: 'checkbox-inline rp-checkbox',
                      name: 'pub',
                    }),
                    label({
                      className: 'regular-checkbox rp-choice-questions',
                      htmlFor: 'checkPublication',
                    }, [
                      span({className: 'access-color'},
                        ['Publication Required (PUB)']),
                    ]),
                  ]),
                ]),

              div(
                {className: 'col-xs-12 rp-group'}, [
                  div({className: 'checkbox'}, [
                    input({
                      checked: col,
                      onChange: () => handleCheckboxChange,
                      type: 'checkbox',
                      className: 'checkbox-inline rp-checkbox',
                      name: 'col',
                    }),
                    label({
                      className: 'regular-checkbox rp-choice-questions',
                      htmlFor: 'checkCollaboration',
                    }, [
                      span({className: 'access-color'},
                        ['Collaboration Required (COL)']),
                    ]),
                  ]),
                ]),

              div(
                {className: 'col-xs-12 rp-group'}, [
                  div({className: 'checkbox'}, [
                    input({
                      checked: irb,
                      onChange: () => handleCheckboxChange,
                      type: 'checkbox',
                      className: 'checkbox-inline rp-checkbox',
                      name: 'irb',
                    }),
                    label({
                      className: 'regular-checkbox rp-choice-questions',
                      htmlFor: 'checkEthics',
                    }, [
                      span({className: 'access-color'},
                        ['Ethics Approval Required (IRB)']),
                    ]),
                  ]),
                ]),

              div(
                {className: 'col-xs-12 rp-group'},
                [
                  div({className: 'checkbox'}, [
                    input({
                      checked: gs,
                      onChange: () => handleCheckboxChange,
                      type: 'checkbox',
                      className: 'checkbox-inline rp-checkbox',
                      name: 'gs',
                    }),
                    label({
                      className: 'regular-checkbox rp-choice-questions',
                      htmlFor: 'checkGeographic',
                    }, [
                      span({className: 'access-color'},
                        ['Geographic Restriction (GS-)']),
                    ]),
                  ]),
                ]),

              div(
                {className: 'col-xs-12 rp-group'}, [
                  div({className: 'checkbox'}, [
                    input({
                      checked: mor,
                      onChange: () => handleCheckboxChange,
                      type: 'checkbox',
                      className: 'checkbox-inline rp-checkbox',
                      name: 'mor',
                    }),
                    label({
                      className: 'regular-checkbox rp-choice-questions',
                      htmlFor: 'checkMoratorium',
                    }, [
                      span({className: 'access-color'},
                        ['Publication Moratorium (MOR)']),
                    ]),
                  ]),
                ]),

              div(
                {className: 'col-xs-12 rp-group', isRendered: general}, [
                  div({className: 'checkbox'}, [
                    input({
                      checked: npoa,
                      onChange: () => handleCheckboxChange,
                      type: 'checkbox',
                      className: 'checkbox-inline rp-checkbox',
                      name: 'npoa'
                    }),
                    label({
                      className: 'regular-checkbox rp-choice-questions',
                      htmlFor: 'checkNpoa',
                    }, [
                      span({className: 'access-color'},
                        ['No Populations Origins or Ancestry Research (NPOA)']),
                    ]),
                  ]),
                ]),

              div(
                {className: 'col-xs-12 rp-group'}, [
                  div({className: 'checkbox'}, [
                    input({
                      checked: npu,
                      onChange: () => handleCheckboxChange,
                      type: 'checkbox',
                      className: 'checkbox-inline rp-checkbox',
                      name: 'npu'
                    }),
                    label({
                      className: 'regular-checkbox rp-choice-questions',
                      htmlFor: 'checkForProfit',
                    }, [
                      span({className: 'access-color'},
                        ['Non-Profit Use Only (NPU)']),
                    ]),
                  ]),
                ]),

              div(
                {className: 'col-xs-12 rp-group'}, [
                  div({className: 'checkbox'}, [
                    input({
                      //checked: secondaryOther,
                      onChange: () => handleCheckboxChange,
                      type: 'checkbox',
                      className: 'checkbox-inline rp-checkbox',
                      name: 'secOther'
                    }),
                    label({
                      className: 'regular-checkbox rp-choice-questions',
                      htmlFor: 'checkSecondaryOther',
                    }, [
                      span({className: 'access-color'},
                        ['Other Secondary Use Terms:']),
                    ]),
                  ]),
                ]),
              div(
                {className: 'col-xs-12 rp-group'}, [
                  textarea({
                    defaultValue: '',//secondaryOtherText,
                    onBlur: (e) => setSecOtherText(e),
                    name: 'secOtherText',
                    className: 'form-control',
                    rows: '6',
                    required: false,
                    placeholder: 'Note - adding free text data use terms in the box will inhibit your dataset from being read by the DUOS Algorithm for decision support.',
                  })
                ]),
            ]),
          ]),
      ]),
      div({className: 'form-group'}, [
        div(
          {className: ' col-xs-12 rp-group'}, [
            label({className: 'control-label rp-title-question'}, [
                '3. Generate your suggested Standardized Data Sharing Language below!',
                span({}, ['If your selections above are complete, press generate and the suggesteed consent form text ' +
                'based on the GA4GH Data Use Ontology and Machine readable Consent Guidance will appear below']),
              ]),
          ]),
      ]),
      button({
        className: 'button',
        onClick: () => generate,
      }, ["Generate Standardized Data Sharing Language"]),
      div(
        {className: 'col-xs-12 rp-group'}, [
          textarea({
            onBlur: (e) => setSDSLText,
            className: 'form-control',
            rows: '12',
            required: false,
          })
        ])
    ])
  );
}
