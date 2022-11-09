import { div, label, span } from 'react-hyperscript-helpers';
import {chunk, filter, isEmpty, isNil} from 'lodash/fp';
import { DAR } from '../../libs/ajax';
import { DownloadLink } from '../../components/DownloadLink';

const styles = {
  flexRowElement: {
    fontFamily: 'Montserrat',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    width: '49rem',
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
    marginBottom: '3rem',
    columnGap: '2rem'
  },
  title: {
    fontWeight: 800,
    fontSize: '2.7rem',
    margin: '1.5rem 0',
  },
  subheader: {
    fontWeight: 800,
    fontSize: '2.4rem',
    margin: '1.5rem 0',
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
    marginBottom: '3rem',
  }
};

const generateLabelSpanContents = (labelValue, key,  spanValue, isLoading) => {
  return div(
    {className: 'flex-row-element', style: styles.flexRowElement, id: `${key}-flex-row-element`},
    !isLoading ? [
      label({ id: `${key}-label`, key: `${key}-label`, style: styles.label}, [labelValue]),
      span({ id: `${key}-span`, key: `${key}-span`, style: styles.value }, [spanValue]),
    ] : [
      div({className: 'text-placeholder', key:`${label}-label-placeholder`, id: `${label}-label-placeholder`, style: {width: '30%', height: '2.4rem', marginBottom: '1.5rem'}}),
      div({className: 'text-placeholder', key:`${label}-text-placeholder`, id: `${label}-label-placeholder`, style: {width: '70%', height: '3.2rem'}}),
    ]
  );
};

const generateLinkContents = (key, id, type, text, fileName, location) => {
  return div(
    {id: key, isRendered: !isNil(location) && !isNil(id)},
    [
      DownloadLink({label: text, onDownload: ()=>{DAR.downloadDARDocument(id, type, fileName);}})
    ]);
};

// function to generate application details content
const dynamicRowGeneration = (rowElementMaxCount, appDetailLabels, loading, cloudComputing) => {
  // lodash/fp filter (non-empty string, non-empty object, non-empty array, booleans)
  // also filter out the cloud-provider element if cloudComputing is false
  const labels = filter(label => {
    return (
      (typeof label.value === 'boolean')
      || (!isEmpty(label.value) && label.key !== 'cloud-provider')
      || (label.key === 'cloud-provider' && cloudComputing === true)
    );
  }) (appDetailLabels);

  const labelArray = labels.map(label => {
    if (typeof label.value === 'boolean') {
      // Inject 'Yes' / 'No' for booleans
      return generateLabelSpanContents(label.title, label.key, (label.value ? 'Yes' : 'No'), loading);
    } else {
      return generateLabelSpanContents(label.title, label.key, label.value, loading);
    }
  });
  // use the chunk method to organize them in arrays of two
  const chunkedArr = chunk(rowElementMaxCount)(labelArray);

  // use a map function to generate a new array that wraps each chunk in the row style
  // template that you can then plug into the component's return statement
  const output = chunkedArr.map((chunk, index) => {
    return div({className: 'information-row', key: `information-row-${index}`, style: styles.applicantInfoRow}, chunk);
  });

  return output;
};


export default function ApplicationInformation(props) {
  const {
    researcher = '- -',
    email = '- -',
    institution = '- -',
    nonTechSummary,
    isLoading = false,
    externalCollaborators = [],
    internalCollaborators = [],
    signingOfficialEmail = '- -',
    itDirectorEmail = '- -',
    internalLabStaff = [],
    anvilStorage = false,
    localComputing = false,
    cloudComputing = false,
    cloudProvider = '- -',
    rus,
    cloudProviderDescription,
    referenceId,
    irbDocumentLocation,
    collaborationLetterLocation,
    irbDocumentName,
    collaborationLetterName
  } = props;

  const processCollaborators = (collaborators) =>
    collaborators.map(collaborator => collaborator.name).join(', ');

  const collaboratorLabels = [
    {value: processCollaborators(externalCollaborators), title: 'External Collaborators', key: 'external-collaborators'},
    {value: processCollaborators(internalCollaborators), title: 'Internal Collaborators', key: 'internal-collaborators'},
    {value: processCollaborators(internalLabStaff), title: 'Internal Lab Staff', key: 'internal-lab-staff'},
  ];

  const institutionLabels = [
    {value: signingOfficialEmail, title: 'Signing Official', key: 'signing-official'},
    {value: itDirectorEmail, title: 'IT Director', key: 'it-director'},
  ];

  const cloudUseLabels = [
    {value: anvilStorage, title: 'Using AnVIL only for storage and analysis', key: 'anvil-storage'},
    {value: localComputing, title: 'Requesting permission to use local computing', key: 'local-computing'},
    {value: cloudComputing, title: 'Requesting permission to use cloud computing', key: 'cloud-computing'},
    {value: cloudProvider, title: 'Cloud Provider (description below)', key: 'cloud-provider'},
  ];

  return (
    div({className: 'application-information-page', style: {padding: '2% 3%', backgroundColor: 'white'}}, [
      div({className: 'applicant-information-container', style: { margin: '0 0 2.5rem 0'}}, [
        div({className: 'applicant-information-subheader', style: styles.title}, ['Applicant Information']),
        div({className: 'information-row', style: styles.row}, [
          generateLabelSpanContents('Researcher', 'researcher', researcher, isLoading),
          generateLabelSpanContents('Researcher Email', 'researcher-email', email, isLoading),
          generateLabelSpanContents('Institution', 'institution', institution, isLoading)
        ])
      ]),
      !isLoading ? div({className: 'non-technical-summary-subheader', style: styles.subheader}, ['Non-Technical Summary'])
        : div({className: 'text-placeholder', key: 'non-technical-summary-title-placeholder', style: {height: '4rem', width: '20%', marginBottom: '2rem'}}),
      div({className: 'non-technical-summary-container'}, [
        !isLoading ? div({className: 'non-technical-summary-textbox', style: styles.textBox}, [nonTechSummary])
          : div({className: 'text-placeholder', key: 'non-technical-summary-placeholder', style: { height: '18rem',
            width: '100%',
          }})
      ]),

      !isLoading ? div({className: 'rus-subheader', style: styles.subheader}, ['Research Use Statement'])
        : div({className: 'text-placeholder', key: 'rus-title-placeholder', style: {height: '4rem', width: '20%', marginBottom: '2rem'}}),
      div({className: 'rus-container'}, [
        !isLoading ? div({className: 'rus-textbox', style: styles.textBox}, [rus])
          : div({className: 'text-placeholder', key: 'rus-placeholder', style: { height: '18rem',
            width: '100%',
          }})
      ]),

      div({className: 'collaborator-details-container', style: { margin: '3rem 0'}}, [
        div({className: 'collaborator-details-subheader', style: styles.subheader,
          isRendered: !(isEmpty(internalCollaborators) && isEmpty(externalCollaborators) && isEmpty(internalLabStaff))}, ['Collaborators']),
        dynamicRowGeneration(2, collaboratorLabels, isLoading)
      ]),

      div({className: 'institution-details-container', style: { margin: '3rem 0'}}, [
        div({className: 'institution-details-subheader', style: styles.subheader}, ['Institution']),
        dynamicRowGeneration(2, institutionLabels, isLoading)
      ]),

      div({className: 'cloud-use-details-container', style: { margin: '3rem 0'}}, [
        div({className: 'cloud-use-details-subheader', style: styles.subheader}, ['Cloud Use']),
        dynamicRowGeneration(2, cloudUseLabels, isLoading, cloudComputing),
        (cloudComputing) ?
          div({className: 'cloud-provider-description-container'}, [
            !isLoading ? div({className: 'cloud-provider-description-textbox', style: styles.textBox}, [cloudProviderDescription])
              : div({className: 'text-placeholder', key: 'cloud-provider-description-placeholder', style: { height: '18rem',
                width: '100%',
              }})
          ])  : ''
      ]),

      div({className: 'document-link-container', style: { margin: '1rem 0'}}, [
        generateLinkContents('irb-doc',referenceId, 'irbDocument', 'Download IRB Protocol', irbDocumentName, irbDocumentLocation),
        generateLinkContents('collab-letter', referenceId, 'collaborationDocument', 'Download Collaboration Letter', collaborationLetterName, collaborationLetterLocation)
      ])
    ])
  );
}

