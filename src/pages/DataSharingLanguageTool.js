import {Styles} from "../libs/theme";
import {br, button, div, h, label, span, textarea} from "react-hyperscript-helpers";
import {RadioButton} from "../components/RadioButton";
import AsyncSelect from "react-select/async/dist/react-select.esm";
import {isNil} from "lodash/fp";
import {Notifications, searchOntologies} from "../libs/utils";
import {DataUseTranslation} from "../libs/dataUseTranslation";
import {useState} from "react";

const buttonStyle = {marginBottom: '2rem', color: '#777'};

export default function DataSharingLanguageTool(props) {
  const [general, setGeneral] = useState(false);
  const [hmb, setHmb] = useState(false);
  const [diseases, setDiseases] = useState(false);
  const [ontologies, setOntologies] = useState();
  const [other, setOther] = useState(false);
  const [otherText, setOtherText] = useState();
  const [nmds, setNmds] = useState(false);
  const [gso, setGso] = useState(false);
  const [pub, setPub] = useState(false);
  const [col, setCol] = useState(false);
  const [irb, setIrb] = useState(false);
  const [gs, setGs] = useState(false);
  const [mor, setMor] = useState(false);
  const [npu, setNpu] = useState(false);
  const [sdsl, setSdsl] = useState("");

  const isTypeOfResearchValid = () => {
    return (general || hmb || (diseases && !isNil(ontologies)) || other );
  };

  const generate = () => {
    isTypeOfResearchValid() ?
      generateHelper()
      : Notifications.showError({text: "Please complete question 1"});
  };

  const generateHelper = () => {
    const darInfo = {
      general: general, diseases: diseases, ontologies: ontologies, other: other, otherText: otherText,
      hmb: hmb, methods: nmds, forProfit: !npu
    };
    const summaries = [];
    const dataUse = (DataUseTranslation.translateDarInfo(darInfo));
    dataUse.primary.forEach((summary) => {
      summaries.push(summary.description);
    });
    dataUse.secondary.forEach((summary) => summaries.push(summary.description));
    setSdsl(summaries.join(" "));
  };

  return (
    div({style: {...Styles.PAGE, color: '#1f3b50' }}, [
      div({style: {...Styles.TITLE, marginTop: '3.5rem'}}, [
        "Standardized Data Sharing Language Tool"
      ]),
      div({style: {...Styles.SMALL, marginTop: '1rem'}}, [
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
      div({className: 'form-group', style: {marginTop: '1rem'}}, [
        label({style: Styles.MEDIUM}, [
          '1. Choose the permitted data uses for your study\'s data ', br(),
          span({style: Styles.MEDIUM_DESCRIPTION}, ['First, you must determine what type of secondary use is permitted for you study\'s data.' +
          ' You do this by selecting one of the options in the following section:']),
        ]),
        div({}, [
          RadioButton({
            value: 'general',
            defaultChecked: general,
            onClick: () => {
              setGeneral(!general), setHmb(false), setDiseases(false), setOther(false);
            },
            label: 'General Research Use: ',
            description: 'use is permitted for any research purpose',
            sdsl: true
          }),

          RadioButton({
            value: 'hmb',
            defaultChecked: hmb,
            onClick: () => {
              setHmb(!hmb), setGeneral(false), setDiseases(false), setOther(false);
            },
            label: 'Health/Medical/Biomedical Use: ',
            description: 'use is permitted for any health, medical, or biomedical purpose',
            sdsl: true
          }),

          RadioButton({
            value: 'diseases',
            defaultChecked: diseases,
            onClick: () => {
              setDiseases(!diseases), setHmb(false), setGeneral(false), setOther(false);
            },
            label: 'Disease-related studies: ',
            description: 'use is permitted for research on the specified disease',
            sdsl: true
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
              setOther(!other), setHmb(false), setDiseases(false), setGeneral(false);
            },
            label: 'Other Use: ',
            description: 'permitted research use is defined as follows: ',
            sdsl: true
          }),

          textarea({
            className: 'form-control',
            onBlur: (e) => setOtherText(e.target.value),
            maxLength: '512',
            rows: '2',
            required: other,
            disabled: !other,
            placeholder: 'Please specify if selected (max. 512 characters)',
          }),
        ]),
      ]),

      div({className: 'form-group', style: {marginTop: '2rem'}}, [
        label({style: Styles.MEDIUM}, [
          '2. Choose any additional constraints you need to put on future uses of your data', br(),
          span({style: Styles.MEDIUM_DESCRIPTION}, ['Then if necessary, you may choose additional terms on your study\'s data to govern it\'s use by adding requirements or limitations.']),
        ]),
        div({}, [
          RadioButton({
            value: 'nmds',
            defaultChecked: nmds,
            onClick: () => setNmds(!nmds),
            label: 'No methods development or validation studies (NMDS)',
            sdsl: true
          }),
          RadioButton({
            value: 'gso',
            defaultChecked: gso,
            onClick: () => setGso(!gso),
            label: 'Genetic Studies Only (GSO)',
            sdsl: true
          }),
          RadioButton({
            value: 'pub',
            defaultChecked: pub,
            onClick: () => setPub(!pub),
            label: 'Publication Required (PUB)',
            sdsl: true
          }),
          RadioButton({
            value: 'col',
            defaultChecked: col,
            onClick: () => setCol(!col),
            label: 'Collaboration Required (COL)',
            sdsl: true
          }),
          RadioButton({
            value: 'irb',
            defaultChecked: irb,
            onClick: () => setIrb(!irb),
            label: 'Ethics Approval Required (IRB)',
            sdsl: true
          }),
          RadioButton({
            value: 'gs',
            defaultChecked: gs,
            onClick: () => setGs(!gs),
            label: 'Geographic Restriction (GS-)',
            sdsl: true
          }),
          RadioButton({
            value: 'mor',
            defaultChecked: mor,
            onClick: () => setMor(!mor),
            label: 'Publication Moratorium (MOR)',
            sdsl: true
          }),
          RadioButton({
            value: 'npu',
            defaultChecked: npu,
            onClick: () => setNpu(!npu),
            label: 'Non-Profit Use Only (NPU)',
            sdsl: true
          })
        ])
      ]),

      div({className: 'form-group'}, [
        label({style: Styles.MEDIUM}, [
          '3. Generate your suggested Standardized Data Sharing Language below', br(),
          span({style: Styles.MEDIUM_DESCRIPTION}, ['If your selections above are complete, press generate and the suggested consent form text ' +
          'based on the GA4GH Data Use Ontology and Machine readable Consent Guidance will appear below.']),
          button({
            style: {...Styles.TABLE.TABLE_TEXT_BUTTON, marginBottom: '2rem'},
            className: 'button',
            onClick: () => generate(),
          }, ["Generate Standardized Data Sharing Language"]),
          textarea({
            defaultValue: sdsl,
            className: 'form-control',
            rows: '12',
            required: false,
          })
        ]),
      ])
    ])
  );
}
