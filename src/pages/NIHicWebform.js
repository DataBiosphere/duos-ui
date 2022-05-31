
import {RadioButton} from '../components/RadioButton';
import {a, div, fieldset, form, h, h3, hr, input, label, span, textarea} from 'react-hyperscript-helpers';
import Select from 'react-select';
import {PageHeading} from '../components/PageHeading';
import AsyncSelect from 'react-select/async';
import {Styles} from '../libs/theme';
import addDatasetIcon from '../images/icon_dataset_add.png';
import {Theme} from '../libs/theme';
import {useState, useEffect} from 'react';
import { searchOntologies } from '../libs/utils';
import DataProviderAgreement from '../assets/Data_Provider_Agreement.pdf';
import eraIcon from '../images/era-commons-logo.png';

export default function NIHICWebform() {
  const [multicenter, setMulticenter] = useState();
  const [individualControlled, setIndividualControlled] = useState();
  const [gsrControlledAccess, setGsrControlledAccess] = useState();
  const [altDataSharing, setAltDataSharing] = useState();
  const [consentGroups, setConsentGroups] = useState([]);
  const [currentConsentName, setCurrentConsentName] = useState('');
  const [currentConsentGeneral, setCurrentConsentGeneral] = useState();
  const [currentConsentHmb, setCurrentConsentHmb] = useState();
  const [currentConsentDisease, setCurrentConsentDisease] = useState();
  const [currentConsentOntologies, setCurrentConsentOntologies] = useState();
  const [currentConsentPoa, setCurrentConsentPoa] = useState();
  const [currentConsentOther, setCurrentConsentOther] = useState();
  const [currentConsentOtherText, setCurrentConsentOtherText] = useState('');
  const [currentConsentNMDS, setCurrentConsentNMDS] = useState();
  const [currentConsentGSO, setCurrentConsentGSO] = useState();
  const [currentConsentPUB, setCurrentConsentPUB] = useState();
  const [currentConsentCOL, setCurrentConsentCOL] = useState();
  const [currentConsentIRB, setCurrentConsentIRB] = useState();
  const [currentConsentGS, setCurrentConsentGS] = useState();
  const [currentConsentMOR, setCurrentConsentMOR] = useState();
  const [currentConsentNPOA, setCurrentConsentNPOA] = useState();
  const [currentConsentNPU, setCurrentConsentNPU] = useState();
  const [currentConsentOther2, setCurrentConsentOther2] = useState();
  const [currentConsentOtherText2, setCurrentConsentOtherText2] = useState('');
  const [submissionThreeMonths, setSubmissionThreeMonths] = useState();
  const [submissionBatches, setSubmissionBatches] = useState();
  const [meetTimelines, setMeetTimelines] = useState();

  useEffect(() => {
  });

  const controlLabelStyle = {
    fontWeight: 500,
    marginBottom: 0
  };

  const logoStyle = {
    height: 23,
    width: 38,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
    backgroundImage: `url(${eraIcon})`,
    display: 'inline-block'
  };


  const nihCenterList = ['National Cancer Institute (NCI)',
    'National Eye Institute (NEI)',
    'National Heart, Lung, and Blood Institute (NHLBI)',
    'National Human Genome Research Institute (NHGRI)',
    'National Institute on Aging (NIA)',
    'National Institute on Alcohol Abuse and Alcoholism (NIAAA)',
    'National Institute of Allergy and Infectious Diseases (NIAID)',
    'National Institute of Arthritis and Musculoskeletal and Skin Diseases (NIAMS)',
    'National Institute of Biomedical Imaging and Bioengineering (NIBIB)',
    'Eunice Kennedy Shriver National Institute of Child Health and Human Development (NICHD)',
    'National Institute on Deafness and Other Communication Disorders (NIDCD)',
    'National Institute of Dental and Craniofacial Research (NIDCR)',
    'National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)',
    'National Institute on Drug Abuse (NIDA)',
    'National Institute of Environmental Health Sciences (NIEHS)',
    'National Institute of General Medical Sciences (NIGMS)',
    'National Institute of Mental Health (NIMH)',
    'National Institute on Minority Health and Health Disparities (NIMHD)',
    'National Institute of Neurological Disorders and Stroke (NINDS)',
    'National Institute of Nursing Research (NINR)',
    'National Library of Medicine (NLM)'];

  const nihCenterOptions = nihCenterList.map(function(item) {
    return {
      value: item,
      label: item
    };
  });

  const studyTypesList = ['Collection', 'Longitudinal', 'Case-control', 'Case set', 'Control set',
    'Parent-offspring trios', 'Cohort'];

  const studyTypeOptions = studyTypesList.map(function(item) {
    return {
      value: item,
      label: item
    };
  });

  const setPrimaryUse = (primaryUse, truthValue) => {
    //if the primary use is not already set to true make the following changes
    if (!truthValue) {
      setCurrentConsentGeneral(false);
      setCurrentConsentHmb(false);
      setCurrentConsentDisease(false);
      setCurrentConsentOntologies([]);
      setCurrentConsentPoa(false);
      setCurrentConsentOther(false);
      setCurrentConsentOtherText('');
      if (primaryUse === 'GRU') {
        setCurrentConsentGeneral(true);
      }
      if (primaryUse === 'HMB') {
        setCurrentConsentHmb(true);
      }
      if (primaryUse === 'DIS') {
        setCurrentConsentDisease(true);
      }
      if (primaryUse === 'POA') {
        setCurrentConsentPoa(true);
      }
      if (primaryUse === 'Other') {
        setCurrentConsentOther(true);
      }
    }
  };

  const createConsent = () => {
    const getPrimaryUse = () => {
      var primaryUse = '';
      if (currentConsentGeneral) {
        primaryUse = primaryUse.concat('General Research Use: use is permitted for any research purpose');
      }
      if (currentConsentHmb) {
        primaryUse = primaryUse.concat('Health/Medical/Biomedical Use: use is permitted for any health, medical, or biomedical purpose');
      }
      if (currentConsentDisease) {
        primaryUse = primaryUse.concat('Disease-related studies: use is permitted for research on the specified diseases [');
        (currentConsentOntologies).forEach((ont) => primaryUse = primaryUse.concat(ont.label));
        primaryUse = primaryUse.concat(']');
      }
      if (currentConsentPoa) {
        primaryUse = primaryUse.concat('Populations, Origins, Ancestry Use: use is permitted exclusively for populations, origins, or ancestry research');
      }
      if (currentConsentOther) {
        primaryUse = primaryUse.concat('Other Use: permitted research use is defined as follows: ');
        primaryUse = primaryUse.concat(currentConsentOtherText);
      }
      return primaryUse;
    };

    const getSecondaryUse = () => {
      var secondaryUse = [];
      if (currentConsentNMDS) {
        secondaryUse.push('No methods development or validation studies (NMDS)');
      }
      if (currentConsentGSO) {
        secondaryUse.push('Genetic Studies Only (GSO)');
      }
      if (currentConsentPUB) {
        secondaryUse.push('Publication Required (PUB)');
      }
      if (currentConsentCOL) {
        secondaryUse.push('Collaboration Required (COL)');
      }
      if (currentConsentIRB) {
        secondaryUse.push('Ethics Approval Required (IRB)');
      }
      if (currentConsentGS) {
        secondaryUse.push('Geographic Restriction (GS-)');
      }
      if (currentConsentMOR) {
        secondaryUse.push('Publication Moratorium (MOR)');
      }
      if (currentConsentNPOA) {
        secondaryUse.push('No Populations Origins or Ancestry Research (NPOA)');
      }
      if (currentConsentNPU) {
        secondaryUse.push('Non-Profit Use Only (NPU)');
      }
      if (currentConsentOther2) {
        secondaryUse.push('Other Secondary Use Terms: ');
        secondaryUse.push(currentConsentOtherText2);
      }
      secondaryUse = secondaryUse.join(', ');
      return secondaryUse;
    };

    const consent = {
      name: currentConsentName,
      primaryUse: getPrimaryUse(),
      secondaryUse: getSecondaryUse()
    };

    const groups = consentGroups;
    groups.push(consent);
    setCurrentConsentName('');
    setCurrentConsentGeneral(false);
    setCurrentConsentHmb(false);
    setCurrentConsentDisease(false);
    setCurrentConsentOntologies([]);
    setCurrentConsentPoa(false);
    setCurrentConsentOther(false);
    setCurrentConsentOtherText('');
    setCurrentConsentNMDS(false);
    setCurrentConsentGSO(false);
    setCurrentConsentPUB(false);
    setCurrentConsentCOL(null);
    setCurrentConsentIRB(false);
    setCurrentConsentGS(false);
    setCurrentConsentMOR(false);
    setCurrentConsentNPOA(false);
    setCurrentConsentNPU(false);
    setCurrentConsentOther2(false);
    setCurrentConsentOtherText2('');
    setConsentGroups(groups);
  };

  return (
    div({style: Styles.PAGE}, [
      div({ className: 'row no-margin' }, [
        PageHeading({
          imgSrc: addDatasetIcon,
          color: 'common',
          descriptionStyle: {color: Theme.palette.primary, fontSize: '19px'},
          title: 'Extramural Genomic Data Sharing Plan & Institutional Certification',
          description: 'This integrated GDSP & IC form combines duplicate fields, allows for digital tracking and statistics, and assigns machine-readable GA4GH Data Use Ontology terms to the datasets upon completion!'
        })
      ]),
      hr({ className: 'section-separator' }),

      form({ name: 'form', 'noValidate': true }, [
        div({ id: 'form-views' }, [
          div({}, [
            div({ className: 'col-lg-10 col-lg-offset-1 col-xs-12' }, [
              fieldset({}, [
                h3({ className: 'rp-form-title common-color' }, ['Administrative Information']),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Principal Investigator Name ',
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group rp-last-group'}, [
                      input({
                        type: 'text',
                        name: 'piName',
                        id: 'piName',
                        maxLength: '256',
                        className: 'form-control',
                        required: true,
                      })
                    ])
                ]),
                div({className: 'form-group'}, [
                  div(
                    {className: ' col-xs-12 rp-group'}, [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Principal Investigator Title ',
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group rp-last-group'}, [
                      input({
                        type: 'text',
                        name: 'piTitle',
                        id: 'piTitle',
                        maxLength: '256',
                        className: 'form-control',
                        required: true,
                      })
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Principal Investigator Email ',
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group rp-last-group'}, [
                      input({
                        type: 'url',
                        name: 'piEmail',
                        id: 'piEmail',
                        maxLength: '256',
                        placeholder: 'email@domain.org',
                        className: 'form-control',
                        required: true,
                      })
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Principal Investigator Institution ',
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group rp-last-group'}, [
                      input({
                        type: 'text',
                        name: 'piInstitute',
                        id: 'piInstitute',
                        maxLength: '256',
                        className: 'form-control',
                        required: true,
                      })
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Assistant/Submitter Name (if applicable)',
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group rp-last-group'}, [
                      input({
                        type: 'text',
                        name: 'assistantName',
                        id: 'assistantName',
                        maxLength: '256',
                        className: 'form-control',
                        required: true,
                      })
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Assistant Submitter Email',
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group rp-last-group'}, [
                      input({
                        type: 'text',
                        name: 'assistantEmail',
                        id: 'assistantEmail',
                        placeholder: 'email@domain.org',
                        maxLength: '256',
                        className: 'form-control',
                        required: true,
                      })
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Authenticate with eRA Commons',
                      ]),
                    ]),
                  div({className: 'col-xs-12 rp-group'}, [
                    a({
                      className: 'btn-secondary',
                      target: '_blank'
                    }, [
                      div({ style: logoStyle }),
                      span({ style: { verticalAlign: '25%' } }, ['Authenticate your account'])
                    ])
                  ]),
                ]),
                div({className: 'form-group'}, [
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'NIH Grant or Contract Number ',
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group rp-last-group'}, [
                      input({
                        type: 'text',
                        name: 'NIHnumber',
                        id: 'inputNIHnumber',
                        maxLength: '256',
                        className: 'form-control',
                        required: true,
                      }),
                    ])
                ]),

                div({className: 'form-group', style: {color: Theme.palette.primary}}, [
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'NIH Institutes/Centers supporting the study',
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'nhgri',
                          type: 'checkbox',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'nhgri',
                        }, [
                          span({style: {color: Theme.palette.primary }},
                            ['NHGRI']),
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'nci',
                          type: 'checkbox',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'nci',
                        }, [
                          span({style: {color: Theme.palette.primary }},
                            ['NCI']),
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'nhlbi',
                          type: 'checkbox',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'nhlbi',
                        }, [
                          span({style: {color: Theme.palette.primary }},
                            ['NHLBI']),
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'nimh',
                          type: 'checkbox',
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'nimh',
                        }, [
                          span({style: {color: Theme.palette.primary }},
                            ['NIMH']),
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'nidcr',
                          type: 'checkbox'
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'nidcr',
                        }, [
                          span({style: {color: Theme.palette.primary }},
                            ['NIDCR']),
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'niaid',
                          type: 'checkbox'
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'niaid',
                        }, [
                          span({style: {color: Theme.palette.primary }},
                            ['NIAID']),
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'ninds',
                          type: 'checkbox'
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'ninds',
                        }, [
                          span({style: {color: Theme.palette.primary }},
                            ['NINDS']),
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'ncats',
                          type: 'checkbox'
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'ncats',
                        }, [
                          span({style: {color: Theme.palette.primary }},
                            ['NCATS']),
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'nia',
                          type: 'checkbox'
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'nia',
                        }, [
                          span({style: {color: Theme.palette.primary }},
                            ['NIA']),
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group'},
                    [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'niddk',
                          type: 'checkbox'
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'niddk',
                        }, [
                          span({style: {color: Theme.palette.primary }},
                            ['NIDDK']),
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'nei',
                          type: 'checkbox'
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'nei',
                        }, [
                          span({style: {color: Theme.palette.primary }},
                            ['NEI']),
                        ]),
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      div({className: 'checkbox'}, [
                        input({
                          id: 'nida',
                          type: 'checkbox'
                        }),
                        label({
                          className: 'regular-checkbox rp-choice-questions',
                          htmlFor: 'nida',
                        }, [
                          span({style: {color: Theme.palette.primary }},
                            ['NIDA']),
                        ]),
                      ]),
                    ]),
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'NIH Program Officer Name',
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      h(Select, {
                        name: 'nihProgramOfficer',
                        id: 'nihProgramOfficer',
                        blurInputOnSelect: true,
                        openMenuOnFocus: true,
                        isDisabled: false,
                        isClearable: true,
                        isMulti: false,
                        isSearchable: true,
                        options: [{value: 'Valentina Di Francesco', label: 'Valentina Di Francesco'}, {value:'Ken Wiley', label: 'Ken Wiley'}],
                        placeholder: 'Select a Program Officer...',
                        className: '',
                        required: true,
                      }),
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-xs-12 rp-group'},
                    [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'NIH Institute/Center for Submission',
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group'},
                    [
                      h(Select, {
                        name: 'nihCenterSubmission',
                        id: 'nihCenterSubmission',
                        blurInputOnSelect: true,
                        openMenuOnFocus: true,
                        isDisabled: false,
                        isClearable: true,
                        isMulti: false,
                        isSearchable: true,
                        options: nihCenterOptions,
                        placeholder: 'Select an NIH IC...',
                        className: '',
                        required: true,
                      })
                    ])
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'NIH Genomic Program Administrator Name',
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      h(Select, {
                        name: 'nihProgramAdmin',
                        id: 'nihProgramAdmin',
                        blurInputOnSelect: true,
                        openMenuOnFocus: true,
                        isDisabled: false,
                        isClearable: true,
                        isMulti: false,
                        isSearchable: true,
                        options: [{value:'Jennifer Strasburger', label:'Jennifer Strasburger'}],
                        placeholder: 'Select a Genomic Program Administrator...',
                        className: '',
                        required: true,
                      })
                    ])
                ]),
              ]),

              h3({ className: 'rp-form-title common-color' }, ['Study/Dataset Information']),

              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'Original Study Name',
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group rp-last-group'}, [
                    input({
                      type: 'text',
                      name: 'originalName',
                      id: 'originalName',
                      maxLength: '256',
                      className: 'form-control',
                      required: true,
                    })
                  ])
              ]),

              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'Study Type',
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    h(Select, {
                      name: 'studyType',
                      id: 'studyType',
                      blurInputOnSelect: true,
                      openMenuOnFocus: true,
                      isDisabled: false,
                      isClearable: true,
                      isMulti: false,
                      isSearchable: true,
                      options: studyTypeOptions,
                      placeholder: 'Select a study type...',
                      className: '',
                      required: true,
                    })
                  ])
              ]),

              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'Project Title (for data to be submitted)',
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group rp-last-group'}, [
                    input({
                      type: 'text',
                      name: 'projectTitle',
                      id: 'projectTitle',
                      maxLength: '256',
                      className: 'form-control',
                      required: true,
                    })
                  ])
              ]),

              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'Is this a multi-center study?',
                    ]),
                  ]),
                div({ className: 'row no-margin' }, [
                  div({ className: 'col-xs-12 dataset-group' }, [

                    RadioButton({
                      style: {
                        color: Theme.palette.primary
                      },
                      id: 'multicenter_yes',
                      defaultChecked: multicenter,
                      onClick: () => setMulticenter(true),
                      label: 'Yes',
                      disabled: false,
                    }),

                    RadioButton({
                      style: {
                        color: Theme.palette.primary
                      },
                      id: 'multicenter_no',
                      defaultChecked: multicenter === false,
                      onClick: () => setMulticenter(false),
                      label: 'No',
                      disabled: false,
                    }),
                  ]),
                ]),
              ]),

              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'List Collaborating Sites (please enter a comma or tab delimited list)',
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group rp-last-group'},[
                    input({
                      type: 'text',
                      name: 'collaboratingsites',
                      id: 'inputcollaboratingsites',
                      maxLength: '256',
                      required: true,
                      className: 'form-control'
                    }),
                  ])
              ]),

              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'The individual level data are to be made available through:',
                    ]),
                  ]),
                div({ className: 'row no-margin' }, [
                  div({ className: 'col-xs-12 dataset-group' }, [

                    RadioButton({
                      style: {
                        color: Theme.palette.primary
                      },
                      id: 'individual_unrestricted',
                      label: 'Unrestricted Access',
                      defaultChecked: individualControlled === false,
                      onClick: () => setIndividualControlled(false)
                    }),

                    RadioButton({
                      style: {
                        color: Theme.palette.primary,
                      },
                      id: 'individual_controlled',
                      label: 'Controlled Access',
                      defaultChecked: individualControlled,
                      onClick: () => setIndividualControlled(true)
                    }),
                  ]),
                ]),
              ]),

              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'The genomic summary results (GSR) from this study are only to be made available through controlled-access',
                    ]),
                  ]),
                div({ className: 'row no-margin' }, [
                  div({ className: 'col-xs-12 dataset-group' }, [

                    RadioButton({
                      style: {
                        color: Theme.palette.primary,
                      },
                      id: 'gsr_controlled_yes',
                      defaultChecked: gsrControlledAccess,
                      onClick: () => setGsrControlledAccess(true),
                      label: 'Yes',
                      disabled: false,
                    }),

                    RadioButton({
                      style: {
                        color: Theme.palette.primary,
                      },
                      id: 'gsr_controlled_no',
                      defaultChecked: gsrControlledAccess === false,
                      onClick: () => setGsrControlledAccess(false),
                      label: 'No',
                      disabled: false,
                    }),
                  ]),
                ]),
              ]),

              div({style: {marginBottom: '15px' }}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'Explanation if controlled-access for GSR was selected',
                    ]),
                  ]),
                div({style: {marginLeft: '15px'}}, [
                  input({
                    type: 'text',
                    name: 'explanation',
                    id: 'explanation',
                    maxLength: '256',
                    className: 'form-control',
                    required: true,
                  })
                ]),
              ]),

              div({style: {backgroundColor: Theme.palette.background.secondary, borderRadius: '9px'} }, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'Consent Group - Name:',
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group rp-last-group'}, [
                    input({
                      type: 'text',
                      name: 'consentGroupName',
                      id: 'consentGroupName',
                      value: currentConsentName,
                      onChange: (e) => setCurrentConsentName(e.target.value),
                      maxLength: '256',
                      className: 'form-control',
                      required: true,
                    })
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    span({className: 'control-label rp-title-question common-color'}, [
                      'Consent Group - Primary Data Use Terms ',
                      span({},
                        ['Please select one of the following data use permissions for your dataset.']),
                      div({
                        style: {'marginLeft': '15px'},
                        className: 'row'
                      }, []),

                      div(
                        {className: 'col-xs-12 rp-group'}, [
                          div({style: {margin: '15px 0'}}, [
                            RadioButton({
                              style: {
                                color: Theme.palette.primary,
                              },
                              id: 'checkGeneral',
                              defaultChecked: currentConsentGeneral,
                              onClick: () => setPrimaryUse('GRU', currentConsentGeneral),
                              label: 'General Research Use: ',
                              description: 'use is permitted for any research purpose',
                              disabled: false,
                            }),

                            RadioButton({
                              style: {
                                color: Theme.palette.primary,
                              },
                              id: 'checkHmb',
                              label: 'Health/Medical/Biomedical Use: ',
                              defaultChecked: currentConsentHmb,
                              onClick: () => setPrimaryUse('HMB', currentConsentHmb),
                              description: 'use is permitted for any health, medical, or biomedical purpose',
                              disabled: false,
                            }),

                            RadioButton({
                              style: {
                                color: Theme.palette.primary,
                              },
                              id: 'checkDisease',
                              defaultChecked: currentConsentDisease,
                              onClick: () => setPrimaryUse('DIS', currentConsentDisease),
                              label: 'Disease-related studies: ',
                              description: 'use is permitted for research on the specified disease',
                              disabled: false,
                            }),
                            div({
                              style: {
                                color: Theme.palette.primary
                              },
                            }, [
                              h(AsyncSelect, {
                                id: 'sel_diseases',
                                isDisabled: !currentConsentDisease,
                                isMulti: true,
                                value: currentConsentOntologies,
                                loadOptions: (query, callback) => searchOntologies(query, callback),
                                onChange: (data) => setCurrentConsentOntologies(data),
                                placeholder: 'Please enter one or more diseases',
                                classNamePrefix: 'select',
                              }),
                            ]),
                          ]),

                          RadioButton({
                            style: {
                              color: Theme.palette.primary
                            },
                            id: 'checkPoa',
                            defaultChecked: currentConsentPoa,
                            onClick: () => setPrimaryUse('POA', currentConsentPoa),
                            label: 'Populations, Origins, Ancestry Use: ',
                            description: 'use is permitted exclusively for populations, origins, or ancestry research',
                            disabled: false,
                          }),

                          RadioButton({
                            style: {
                              color: Theme.palette.primary
                            },
                            id: 'checkOther',
                            defaultChecked: currentConsentOther,
                            onClick: () => setPrimaryUse('Other', currentConsentOther),
                            label: 'Other Use:',
                            description: 'permitted research use is defined as follows: ',
                            disabled: false
                          }),

                          textarea({
                            disabled: !currentConsentOther,
                            value: currentConsentOtherText,
                            onChange: (e) => setCurrentConsentOtherText(e.target.value),
                            className: 'form-control',
                            name: 'otherText',
                            id: 'otherText',
                            maxLength: '512',
                            rows: '2',
                            placeholder: 'Please specify if selected (max. 512 characters)'
                          }),
                        ]),

                      div({className: 'form-group'}, [
                        div(
                          {className: 'col-xs-12 rp-group'}, [
                            label({className: 'control-label rp-title-question common-color'}, [
                              'Consent Group - Secondary Data Use Terms',
                              span({}, ['Please select all applicable data use parameters.']),
                            ]),
                          ]),
                      ]),

                      div(
                        {className: 'col-xs-12 rp-group'}, [
                          div({className: 'checkbox'}, [
                            input({
                              id: 'checkMethods',
                              type: 'checkbox',
                              className: 'checkbox-inline rp-checkbox',
                              name: 'methods',
                              checked: currentConsentNMDS,
                              onChange: () => setCurrentConsentNMDS(!currentConsentNMDS)
                            }),
                            label({
                              className: 'regular-checkbox rp-choice-questions',
                              htmlFor: 'checkMethods',
                            }, [
                              span({style: {color: Theme.palette.primary }},
                                ['No methods development or validation studies (NMDS)']),
                            ]),
                          ]),
                        ]),

                      div(
                        {className: 'col-xs-12 rp-group'},
                        [
                          div({className: 'checkbox'}, [
                            input({
                              id: 'checkGenetic',
                              type: 'checkbox',
                              className: 'checkbox-inline rp-checkbox',
                              name: 'genetic',
                              checked: currentConsentGSO,
                              onClick: () => setCurrentConsentGSO(!currentConsentGSO)
                            }),
                            label({
                              className: 'regular-checkbox rp-choice-questions',
                              htmlFor: 'checkGenetic',
                            }, [
                              span({style: {color: Theme.palette.primary }},
                                ['Genetic Studies Only (GSO)']),
                            ]),
                          ]),
                        ]),

                      div(
                        {className: 'col-xs-12 rp-group'}, [
                          div({className: 'checkbox'}, [
                            input({
                              id: 'checkPublication',
                              type: 'checkbox',
                              className: 'checkbox-inline rp-checkbox',
                              name: 'publication',
                              checked: currentConsentPUB,
                              onClick: () => setCurrentConsentPUB(!currentConsentPUB)
                            }),
                            label({
                              className: 'regular-checkbox rp-choice-questions',
                              htmlFor: 'checkPublication',
                            }, [
                              span({ style: {color: Theme.palette.primary }},
                                ['Publication Required (PUB)']),
                            ]),
                          ]),
                        ]),

                      div(
                        {className: 'col-xs-12 rp-group'}, [
                          div({className: 'checkbox'}, [
                            input({
                              id: 'checkCollaboration',
                              type: 'checkbox',
                              className: 'checkbox-inline rp-checkbox',
                              name: 'collaboration',
                              checked: currentConsentCOL,
                              onClick: () => setCurrentConsentCOL(!currentConsentCOL)
                            }),
                            label({
                              className: 'regular-checkbox rp-choice-questions',
                              htmlFor: 'checkCollaboration',
                            }, [
                              span({ style: {color: Theme.palette.primary }},
                                ['Collaboration Required (COL)']),
                            ]),
                          ]),
                        ]),

                      div(
                        {className: 'col-xs-12 rp-group'}, [
                          div({className: 'checkbox'}, [
                            input({
                              id: 'checkEthics',
                              type: 'checkbox',
                              className: 'checkbox-inline rp-checkbox',
                              name: 'ethics',
                              checked: currentConsentIRB,
                              onClick: () => setCurrentConsentIRB(!currentConsentIRB)
                            }),
                            label({
                              className: 'regular-checkbox rp-choice-questions',
                              htmlFor: 'checkEthics',
                            }, [
                              span({ style: {color: Theme.palette.primary }},
                                ['Ethics Approval Required (IRB)']),
                            ]),
                          ]),
                        ]),

                      div(
                        {className: 'col-xs-12 rp-group'}, [
                          div({className: 'checkbox'}, [
                            input({
                              id: 'checkGeographic',
                              type: 'checkbox',
                              className: 'checkbox-inline rp-checkbox',
                              name: 'geographic',
                              checked: currentConsentGS,
                              onClick: () => setCurrentConsentGS(!currentConsentGS)
                            }),
                            label({
                              className: 'regular-checkbox rp-choice-questions',
                              htmlFor: 'checkGeographic',
                            }, [
                              span({ style: {color: Theme.palette.primary }},
                                ['Geographic Restriction (GS-)']),
                            ]),
                          ]),
                        ]),

                      div(
                        {className: 'col-xs-12 rp-group'}, [
                          div({className: 'checkbox'}, [
                            input({
                              id: 'checkMoratorium',
                              type: 'checkbox',
                              className: 'checkbox-inline rp-checkbox',
                              name: 'moratorium',
                              checked: currentConsentMOR,
                              onClick: () => setCurrentConsentMOR(!currentConsentMOR)
                            }),
                            label({
                              className: 'regular-checkbox rp-choice-questions',
                              htmlFor: 'checkMoratorium',
                            }, [
                              span({ style: {color: Theme.palette.primary }},
                                ['Publication Moratorium (MOR)']),
                            ]),
                          ]),
                        ]),

                      div(
                        {className: 'col-xs-12 rp-group'}, [
                          div({className: 'checkbox'}, [
                            input({
                              id: 'checkNpoa',
                              type: 'checkbox',
                              className: 'checkbox-inline rp-checkbox',
                              name: 'npoa',
                              checked: currentConsentNPOA,
                              onClick: () => setCurrentConsentNPOA(!currentConsentNPOA)
                            }),
                            label({
                              className: 'regular-checkbox rp-choice-questions',
                              htmlFor: 'checkNpoa',
                            }, [
                              span({ style: {color: Theme.palette.primary }},
                                ['No Populations Origins or Ancestry Research (NPOA)']),
                            ]),
                          ]),
                        ]),

                      div(
                        {className: 'col-xs-12 rp-group'}, [
                          div({className: 'checkbox'}, [
                            input({
                              id: 'checkForProfit',
                              type: 'checkbox',
                              className: 'checkbox-inline rp-checkbox',
                              name: 'forProfit',
                              checked: currentConsentNPU,
                              onClick: () => setCurrentConsentNPU(!currentConsentNPU)
                            }),
                            label({
                              className: 'regular-checkbox rp-choice-questions',
                              htmlFor: 'checkForProfit',
                            }, [
                              span({ style: {color: Theme.palette.primary }},
                                ['Non-Profit Use Only (NPU)']),
                            ]),
                          ]),
                        ]),

                      div(
                        {className: 'col-xs-12 rp-group'}, [
                          div({className: 'checkbox'}, [
                            input({
                              id: 'checkOtherSecondary',
                              type: 'checkbox',
                              className: 'checkbox-inline rp-checkbox',
                              name: 'other2',
                              checked: currentConsentOther2,
                              onClick: () => setCurrentConsentOther2(!currentConsentOther2)
                            }),
                            label({
                              className: 'regular-checkbox rp-choice-questions',
                              htmlFor: 'checkOtherSecondary',
                            }, [
                              span({style: {color: Theme.palette.primary }},
                                ['Other Secondary Use Terms:']),
                            ]),
                          ]),
                        ]),
                      div(
                        {className: 'col-xs-12 rp-group'}, [
                          textarea({
                            disabled: !currentConsentOther2,
                            value: currentConsentOtherText2,
                            onChange: (e) => setCurrentConsentOtherText2(e),
                            name: 'otherText',
                            id: 'inputOtherText',
                            className: 'form-control',
                            rows: '6',
                            required: false,
                            placeholder: 'Note - adding free text data use terms in the box will inhibit your dataset from being read by the DUOS Algorithm for decision support.',
                          })
                        ]),
                    ]),
                  ]),

                div({ className: 'row no-margin' }, [
                  div({ className: 'col-xs-12' }, [
                    a({
                      id: 'btn_addConsent',
                      onClick: () => createConsent(),
                      className: 'f-right btn-primary bold'
                    }, ['Add Consent Group']),
                  ])
                ]),
              ]),

              div({style: {backgroundColor: Theme.palette.background.secondary, borderRadius: '9px', margin: '15px 0'} }, [
                consentGroups.map((group, index) => {
                  return(
                    div({key: 'consent_group_id' + index, style: {padding: '10px', margin: '15px',  color: Theme.palette.primary}}, [
                      div({key: 'group_id', style: {fontSize: '18px', padding: '10px 0', fontWeight: 500}}, ['Consent Group ' + (index + 1)]),
                      div({style: {display: 'flex',  fontSize: '16px'}}, [
                        div({key: 'name_label', style: {fontWeight: 500, marginRight: '5px',}}, ['Name: ']),
                        div({key: 'name_value'}, [group.name]),
                      ]),
                      div({style: {display: 'flex', fontSize: '16px'}}, [
                        div({key: 'primary_label', style: {fontWeight: 500, marginRight: '5px',}}, ['Primary Use: ']),
                        div({key: 'primary_value'}, [group.primaryUse]),
                      ]),
                      div({style: {display: 'flex', fontSize: '16px'}}, [
                        div({key: 'secondary_label', style: {fontWeight: 500, marginRight: '5px'}}, ['Secondary Use: ']),
                        div({key: 'secondary_value'}, [group.secondaryUse]),
                      ])
                    ])
                  );
                })
              ]),


              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'Are you requesting an Alternative Data Sharing Plan for samples that cannot be shared through a public database or repository?',
                    ]),
                  ]),
                div({ className: 'row no-margin' }, [
                  div({ className: ' col-xs-12 dataset-group' }, [

                    RadioButton({
                      style: {
                        color: Theme.palette.primary,
                      },
                      id: 'altDataSharing_yes',
                      defaultChecked: altDataSharing,
                      onClick: () => setAltDataSharing(true),
                      label: 'Yes',
                      disabled: false,
                    }),

                    RadioButton({
                      style: {
                        color: Theme.palette.primary,
                      },
                      id: 'altDataSharing_no',
                      defaultChecked: altDataSharing === false,
                      onClick: () => setAltDataSharing(false),
                      label: 'No',
                      disabled: false,
                    }),
                  ]),
                ]),
              ]),

              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'Please mark the reasons for which you are requesting an Alternative Data Sharing Plan',
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    div({className: 'checkbox'}, [
                      input({
                        id: 'legal_restrictions',
                        type: 'checkbox'
                      }),
                      label({
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'legal_restrictions',
                      }, [
                        span({style: {color: Theme.palette.primary }},
                          ['Legal Restrictions']),
                      ]),
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    div({className: 'checkbox'}, [
                      input({
                        id: 'informed_consent',
                        type: 'checkbox',
                      }),
                      label({
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'informed_consent',
                      }, [
                        span({style: {color: Theme.palette.primary }},
                          ['Informed consent processes are inadequate to support data sharing for the following reasons:']),
                      ]),
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    div({className: 'checkbox'}, [
                      input({
                        id: 'unavailable',
                        type: 'checkbox',
                      }),
                      label({
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'unavailable',
                      }, [
                        span({style: {color: Theme.palette.primary }},
                          ['The consent forms are unavailable or non-existent for samples collected after January 25, 2015']),
                      ]),
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    div({className: 'checkbox'}, [
                      input({
                        id: 'future_use',
                        type: 'checkbox',
                      }),
                      label({
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'future_use',
                      }, [
                        span({style: {color: Theme.palette.primary }},
                          [' The consent process did not explicitly address future use or broad data sharing for samples collect after January 25, 2015']),
                      ]),
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    div({className: 'checkbox'}, [
                      input({
                        id: 'risks',
                        type: 'checkbox',
                      }),
                      label({
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'risks',
                      }, [
                        span({style: {color: Theme.palette.primary }},
                          ['The consent process inadequately address risks related to future use or broad data sharing for samples collected after January 25, 2015']),
                      ]),
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    div({className: 'checkbox'}, [
                      input({
                        id: 'original_use_only',
                        type: 'checkbox',
                      }),
                      label({
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'original_use_only',
                      }, [
                        span({style: {color: Theme.palette.primary }},
                          ['The consent process specifically precludes future use or broad sharing (including a statement that use of data will be limited to the original researchers)']),
                      ]),
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    div({className: 'checkbox'}, [
                      input({
                        id: 'limitations',
                        type: 'checkbox',
                      }),
                      label({
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'limitations',
                      }, [
                        span({style: {color: Theme.palette.primary }},
                          ['Other informed consent limitations or concerns']),
                        '',
                      ]),
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    div({className: 'checkbox'}, [
                      input({
                        id: 'other_reason',
                        type: 'checkbox',
                      }),
                      label({
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'other_reason',
                      }, [
                        span({style: {color: Theme.palette.primary }},
                          ['Other']),
                        '',
                      ]),
                    ]),
                  ]),
              ]),

              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'Explanation for Request',
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group rp-last-group'}, [
                    input({
                      type: 'text',
                      name: 'explanation',
                      id: 'inputexplanation',
                      maxLength: '256',
                      required: true,
                      className: 'form-control'
                    }),
                  ])
              ]),

              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'Alternative Data Sharing Plan',
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group rp-last-group'}, [
                    input({
                      type: 'text',
                      name: 'description',
                      id: 'inputDescription',
                      maxLength: '256',
                      required: true,
                      className: 'form-control'
                    }),
                  ])
              ]),

              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'If needed, please include additional information',
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group rp-last-group'}, [
                    input({
                      type: 'text',
                      name: 'Acknowledgement',
                      id: 'inputAcknowledgement',
                      maxLength: '256',
                      className: 'form-control'
                    }),
                  ])
              ]),

              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'Data will be submitted',
                    ]),
                  ]),
                div({ className: 'row no-margin' }, [
                  div({ className: 'col-xs-12 dataset-group' }, [

                    RadioButton({
                      style: {
                        color: Theme.palette.primary,
                      },
                      id: 'submission_3months',
                      label: 'within 3 months of last data generated or last clinical visit',
                      defaultChecked: submissionThreeMonths,
                      onClick: () => {
                        setSubmissionThreeMonths(true);
                        setSubmissionBatches(false);
                      }
                    }),

                    RadioButton({
                      style: {
                        color: Theme.palette.primary
                      },
                      id: 'submission_batches',
                      label: 'by batches over Study Timeline (e.g. based on clinical trial enrollment benchmarks)',
                      defaultChecked: submissionBatches,
                      onClick: () => {
                        setSubmissionBatches(true);
                        setSubmissionThreeMonths(false);
                      }
                    }),
                  ]),
                ]),
              ]),

              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'Data to be released will meet the timeframes specified in the NHGRI Guidance for Data Submission and Data Release',
                    ]),
                  ]),
                div({ className: 'row no-margin' }, [
                  div({ className: 'col-xs-12 dataset-group' }, [

                    RadioButton({
                      style: {
                        color: Theme.palette.primary
                      },
                      id: 'meetTimelines_yes',
                      label: 'Yes',
                      defaultChecked: meetTimelines,
                      onClick: () => setMeetTimelines(true)
                    }),

                    RadioButton({
                      style: {
                        color: Theme.palette.primary
                      },
                      id: 'meetTimelines_no',
                      label: 'No',
                      defaultChecked: meetTimelines === false,
                      onClick: () => setMeetTimelines(false)
                    }),
                  ]),
                ]),
              ]),

              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'Target data delivery date',
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group rp-last-group'}, [
                    input({
                      type: 'text',
                      id: 'deliveryDate',
                      maxLength: '256',
                      className: 'form-control',
                      placeholder: 'MM/DD/YYYY'
                    })
                  ])
              ]),

              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'Target public release date',
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    input({
                      type: 'text',
                      id: 'releaseDate',
                      maxLength: '256',
                      className: 'form-control',
                      placeholder: 'MM/DD/YYYY'
                    })
                  ])
              ]),

              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'Estimated # of bytes of data to be deposited',
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group rp-last-group'}, [
                    input({
                      type: 'text',
                      name: 'description',
                      id: 'inputbytesofdata',
                      maxLength: '256',
                      className: 'form-control',
                      required: true,
                    })
                  ])
              ]),

              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'Estimated # of Study Participants',
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group rp-last-group'}, [
                    input({
                      type: 'text',
                      name: 'studyparticipants',
                      id: 'inputstudyparticipants',
                      maxLength: '256',
                      className: 'form-control'
                    })
                  ])
              ]),

              div({className: 'form-group'}, [
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    label({className: 'control-label rp-title-question common-color'}, [
                      'Samples genotyped/sequenced (check all data types expected for this study)',
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    div({className: 'checkbox'}, [
                      input({
                        id: 'species',
                        type: 'checkbox'
                      }),
                      label({
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'species',
                      }, [
                        span({style: {color: Theme.palette.primary}},
                          ['Species']),
                      ]),
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    div({className: 'checkbox'}, [
                      input({
                        id: 'sample_collection',
                        type: 'checkbox',
                      }),
                      label({
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'sample_collection',
                      }, [
                        span({style: {color: Theme.palette.primary}},
                          ['Sample Collection']),
                      ]),
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    div({className: 'checkbox'}, [
                      input({
                        id: 'phenotype',
                        type: 'checkbox'
                      }),
                      label({
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'phenotype',
                      }, [
                        span({style: {color: Theme.palette.primary}},
                          ['Phenotype']),
                      ]),
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    div({className: 'checkbox'}, [
                      input({
                        id: 'genotype',
                        type: 'checkbox'
                      }),
                      label({
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'genotype',
                      }, [
                        span({style: {color: Theme.palette.primary}},
                          ['Genotypes']),
                      ]),
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    div({className: 'checkbox'}, [
                      input({
                        id: 'general',
                        type: 'checkbox',
                      }),
                      label({
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'general',
                      }, [
                        span({style: {color: Theme.palette.primary}},
                          ['General']),
                      ]),
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    div({className: 'checkbox'}, [
                      input({
                        id: 'sequencing',
                        type: 'checkbox'
                      }),
                      label({
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'sequencing',
                      }, [
                        span({style: {color: Theme.palette.primary}},
                          ['Sequencing']),
                      ]),
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'},[
                    div({className: 'checkbox'}, [
                      input({
                        id: 'sample_types',
                        type: 'checkbox',
                      }),
                      label({
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'sample_types',
                      }, [
                        span({style: {color: Theme.palette.primary}},
                          ['Sample Types']),
                      ]),
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    div({className: 'checkbox'}, [
                      input({
                        id: 'analyses',
                        type: 'checkbox',
                      }),
                      label({
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'analyses',
                      }, [
                        span({style: {color: Theme.palette.primary}},
                          ['Analyses']),
                      ]),
                    ]),
                  ]),
                div(
                  {className: 'col-xs-12 rp-group'}, [
                    div({className: 'checkbox'}, [
                      input({
                        id: 'array_data',
                        type: 'checkbox',
                      }),
                      label({
                        className: 'regular-checkbox rp-choice-questions',
                        htmlFor: 'array_data',
                      }, [
                        span({style: {color: Theme.palette.primary}},
                          ['Array Data']),
                      ]),
                    ]),
                  ]),
              ]),


              div({ className: 'form-group'}, [
                div({ className: 'col-xs-12' }, [
                  label({ className: 'control-label rp-title-question common-color' }, [
                    'Dataset Registration Agreement'
                  ])
                ]),

                div({ className: 'row no-margin' }, [
                  div({ className: 'col-xs-12 rp-group' }, [
                    label({ style: controlLabelStyle, className: 'default-color' },
                      ['By submitting this dataset registration, you agree to comply with all terms put forth in the agreement.'])
                  ]),

                  div({ className: 'col-xs-12 rp-group' }, [
                    a({
                      id: 'link_downloadAgreement', href: DataProviderAgreement, target: '_blank',
                      className: 'col-md-4 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color'
                    }, [
                      span({ className: 'glyphicon glyphicon-download' }),
                      'Dataset Registration Agreement'
                    ])
                  ]),
                ]),

                div({className: 'form-group'}, [
                  div(
                    {className: 'col-xs-12 rp-group'}, [
                      label({className: 'control-label rp-title-question common-color'}, [
                        'Principal Investigator Signature',
                      ]),
                    ]),
                  div(
                    {className: 'col-xs-12 rp-group rp-last-group'}, [
                      input({
                        type: 'text',
                        name: 'piSignature',
                        id: 'piSignature',
                        maxLength: '256',
                        className: 'form-control',
                        required: true,
                      })
                    ])
                ]),

                div({ className: 'row no-margin' }, [
                  div({ className: 'col-xs-12' }, [
                    a({
                      id: 'btn_submit',
                      className: 'f-right btn-primary dataset-background bold'
                    }, ['Submit to Signing Official']),
                  ])
                ])
              ]),
            ])
          ]),
        ])
      ])
    ])
  );
}

