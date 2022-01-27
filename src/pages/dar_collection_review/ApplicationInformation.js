import { div, label, span, h } from 'react-hyperscript-helpers';
import AtAGlance from './AtAGlance';

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
  nonTechSummaryText: {
    marginTop: '1.5rem',
    backgroundColor: 'rgb(237	234	228	)',
    padding: '3rem',
    fontSize: '1.9rem'
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
  } = props;

  return (
    div({className: 'application-information-page', style: {padding: '3%', backgroundColor: 'white'}}, [
      !isLoading
        ? h(AtAGlance, {collection: collection, dataUseBuckets: dataUseBuckets, styles: styles})
        : div({className: 'text-placeholder', key: 'application-information-title-placeholder', style: {height: '5rem', width: '20%', marginBottom: '2rem'}}),

      //todo: Applicant Information
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
        !isLoading ? div({className: 'non-technical-summary-textbox', style: styles.nonTechSummaryText}, [nonTechSummary])
          : div({className: 'text-placeholder', key: 'non-technical-summary-placeholder', style: { height: '18rem',
            width: '100%',
          }})
      ]),
       //todo: Application Details
      div({className: 'application-details-container', style: { margin: '2.5rem 0'}}, [
        div({className: 'applicant-details-subheader', style: styles.title}, ["Application Details"]),
        div({className: 'information-row', style: styles.row}, [
          generateLabelSpanContents('External Collaborators', 'external-collaborators', researcher, isLoading),
          generateLabelSpanContents('Internal Collaborators', 'internal-collaborators', researcher, isLoading)
        ]),
        div({className: 'information-row', style: styles.row}, [

        ]),
        div({className: 'information-row', style: styles.row}, [

          generateLabelSpanContents('', 'row-three-blank', '', false) //blank span to keep row elements in line with those above
        ])
      ]),
    ])
  );
}

