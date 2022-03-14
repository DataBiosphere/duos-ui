import { div, label, span, h } from 'react-hyperscript-helpers';
import AtAGlance from './AtAGlance';
import {_, chunk, filter, isBoolean, isEmpty} from "lodash/fp";

const styles = {
  flexRowElement: {
    fontFamily: 'Montserrat',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    width: '48rem',
  },
  label: {
    fontWeight: 600,
    flex: 1,
    fontSize: '2rem',
  },
  value: {
    fontWeight: 400,
    flex: 2,
    fontSize: '2rem',
  },
  row: {
    width: '80%',
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '5rem',
  },
  title: {
    fontWeight: 800,
    fontSize: '2.7rem',
  },
  subheader: {
    fontWeight: 800,
    fontSize: '2.4rem',
  },
  textBox: {
    marginTop: '1.5rem',
    backgroundColor: 'rgb(237	234	228	)',
    padding: '3rem',
    fontSize: '1.9rem'
  },
  applicantInfoRow: {
    width: '80%',
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5rem',
  },
};

const generateLabelSpanContents = (labelValue, key,  spanValue, isLoading) => {
  return div(
    {className: 'flex-row-element', style: styles.flexRowElement},
    !isLoading ? [
      label({ className: `${key}-label`, style: styles.label}, [labelValue]),
      span({ className: `${key}-span`, style: styles.value }, [spanValue]),
    ] : [
      div({className: 'text-placeholder', key:`${label}-label-placeholder`, style: {width: '30%', height: '2.4rem', marginBottom: '1.5rem'}}),
      div({className: 'text-placeholder', key:`${label}-text-placeholder`, style: {width: '70%', height: '3.2rem'}}),
    ]
  );
};

// What you should do is use lodash's filter() with appDetailLabels so that
// only the elements with a valid label[0] value (non-empty string, non-empty object, non-empty array, booleans) show up.
// typeof label[0] === 'boolean' || !isEmpty(label[0])
// The filter method will return a new array of the appDetailLabels that can be processed with generateLabelSpanContents

// function to generate application details content
const dynamicRowGeneration = (rowElementMaxCount, appDetailLabels, loading) => {
  //const appDetails = appDetailLabels.filter(label => (typeof label[0] !== 'boolean' && isEmpty(label[0])));
  // const labels = filter(
  //     appDetailLabels, label => {
  //   (typeof label.value === 'boolean' || !isEmpty(label.value));
  // });
  debugger; // eslint-disable-line
  const labelArray = appDetailLabels.map(label => {
    // todo: shold we display false booleans?
    if (typeof label.value === 'boolean') {
      return generateLabelSpanContents(label.title, label.key, 'Yes', loading);
    // only generate elements that are populated
    } else if (!isEmpty(label.value)) {
      // check to see if processing is required for output (booleans)
      return generateLabelSpanContents(label.title, label.key, label.value, loading);
    }
  });
  // use the chunk method to organize them in arrays of two
  const chunkedArr = chunk(rowElementMaxCount)(labelArray);

  // use a map function to generate a new array that wraps each chunk in the row style
  // template that you can then plug into the component's return statement
  const output = chunkedArr.map(chunk => {
    return div({className: 'information-row', style: styles.applicantInfoRow}, chunk);
  });

  return output;
};


export default function ApplicationInformation(props) {
  const {
    researcher = '- - ',
    email = '- -',
    department = '- -',
    city = '- -',
    country = '- -',
    institution = '- -',
    pi = '- -',
    piEmail = '- -',
    nonTechSummary,
    isLoading = false,
    collection,
    dataUseBuckets,
    externalCollaborators = [],
    internalCollaborators = [],
    signingOfficial = '- -',
    itDirector = '- -',
    signingOfficialEmail = '- -',
    itDirectorEmail = '- -',
    internalLabStaff = [],
    anvilStorage = '',
    localComputing = '',
    cloudComputing = '',
    cloudProvider,
    cloudProviderDescription
  } = props;

  const appDetailLabels = [
    {value: externalCollaborators, title: 'External Collaborators', key: 'external-collaborators'},
    {value: internalCollaborators, title: 'Internal Collaborators', key: 'internal-collaborators'},
    {value: signingOfficial, title: 'Signing Official', key: 'signing-official'},
    {value: itDirector, title: 'IT Director', key: 'it-director'},
    {value: signingOfficialEmail, title: 'Signing Official Email', key: 'signing-official-email'},
    {value: itDirectorEmail, title: 'IT Director Email', key: 'it-director-email'},
    {value: internalLabStaff, title: 'Internal Lab Staff', key: 'internal-lab-staff'},
    {value: anvilStorage, title: 'Using AnVIL only for storage and analysis', key: 'anvil-storage'},
    {value: localComputing, title: 'Requesting Permission to use local computing', key: 'local-computing'},
    {value: cloudComputing, title: 'Requesting permission to use cloud computing', key: 'cloud-computing'},
    {value: cloudProvider, title: 'Cloud Provider (description below)', key: 'cloud-provider'},
  ];

  return (
    div({className: 'application-information-page', style: {padding: '3%', backgroundColor: 'white'}}, [
      !isLoading
        ? h(AtAGlance, {collection: collection, dataUseBuckets: dataUseBuckets, styles: styles})
        : div({className: 'text-placeholder', key: 'application-information-title-placeholder', style: {height: '5rem', width: '20%', marginBottom: '2rem'}}),

      div({className: 'applicant-information-container', style: { margin: '2.5rem 0'}}, [
        div({className: 'applicant-information-subheader', style: styles.title}, ["Applicant Information"]),
        div({className: 'information-row', style: styles.row}, [
          generateLabelSpanContents('Researcher', 'researcher', researcher, isLoading),
          generateLabelSpanContents('Researcher Email', 'researcher-email', email, isLoading),
          generateLabelSpanContents('Department', 'department', department, isLoading)
        ]),
        div({className: 'information-row', style: styles.row}, [
          generateLabelSpanContents('City', 'city', city, isLoading),
          generateLabelSpanContents('Country', 'country', country, isLoading),
          generateLabelSpanContents('Institution', 'institution', institution, isLoading)
        ]),
        div({className: 'information-row', style: styles.row}, [
          generateLabelSpanContents('Principal Investgator', 'principal-investigator', pi, isLoading),
          generateLabelSpanContents('Principal Investigator Email', 'pi-email', piEmail, isLoading),
          generateLabelSpanContents('', 'row-three-blank', '', false) //blank span to keep row elements in line with those above
        ])
      ]),
      !isLoading ? div({className: 'non-technical-summary-subheader', style: styles.title}, ["Non-Technical Summary"])
        : div({className: 'text-placeholder', key: 'non-technical-summary-title-placeholder', style: {height: '4rem', width: '20%', marginBottom: '2rem'}}),
      div({className: 'non-technical-summary-container'}, [
        !isLoading ? div({className: 'non-technical-summary-textbox', style: styles.textBox}, [nonTechSummary])
          : div({className: 'text-placeholder', key: 'non-technical-summary-placeholder', style: { height: '18rem',
            width: '100%',
          }})
      ]),
      div({className: 'application-details-container', style: { margin: '2.5rem 0'}}, [
        div({className: 'applicant-details-subheader', style: styles.title}, ["Application Details"]),
        dynamicRowGeneration(2, appDetailLabels, isLoading),
        (cloudComputing) ? div({className: 'cloud-provider-description-container'}, [
          !isLoading ? div({className: 'cloud-provider-description-textbox', style: styles.textBox}, [cloudProviderDescription])
            : div({className: 'text-placeholder', key: 'cloud-provider-description-placeholder', style: { height: '18rem',
              width: '100%',
            }})
        ])  : ''
      ]),
    ])
  );
}

