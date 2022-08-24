import { useState, useEffect} from 'react';
import { a, div, h, h2, h3, h4, button, span } from 'react-hyperscript-helpers';
import { FormField, FormValidators, FormFieldTypes } from '../../components/forms/forms';
import { eRACommons } from '../../components/eRACommons';
import './dar_application.css';

export default function ResearcherInfo(props) {
  const {
    allSigningOfficials,
    completed,
    darCode,
    cloudProviderDescription,
    eRACommonsDestination,
    // externalCollaborators,
    formFieldChange,
    internalCollaborators,
    invalidResearcher,
    // labCollaborators,
    location,
    nihValid,
    onNihStatusUpdate,
    partialSave,
    // researcher,
    showValidationMessages,
    // nextPage,
    cloudProviderType,
    cloudProvider,
    isCloudUseInvalid,
    isCloudProviderInvalid,
    isAnvilUseInvalid,
    ariaLevel = 2,
    researcher
  } = props;

  const onChange = ({ key, value, isValid }) => {
    /* eslint-disable no-console */
    console.log('on form change!', key, value, isValid);
  };

  //initial state variable assignment
  const [checkCollaborator, setCheckCollaborator] = useState(props.checkCollaborator);
  const [checkNihDataOnly, setCheckNihDataOnly] = useState(props.checkNihDataOnly);
  const [signingOfficial, setSigningOfficial] = useState();
  const [itDirector, setITDirector] = useState(props.itDirector || '');
  const [anvilUse, setAnvilUse] = useState(props.anvilUse || '');
  const [cloudUse, setCloudUse] = useState(props.cloudUse || '');
  const [localUse, setLocalUse] = useState(props.localUse || '');
  const [researcherUser, setResearcherUser] = useState(props.researcherUser);
  const [libraryCardReqSatisfied, setLibraryCardReqSatisfied] = useState(false);

  useEffect(() => {
    setSigningOfficial(props.signingOfficial);
    setCheckCollaborator(props.checkCollaborator);
    setCheckNihDataOnly(props.checkNihDataOnly);
    setITDirector(props.itDirector);
    setAnvilUse(props.anvilUse);
    setCloudUse(props.cloudUse);
    setLocalUse(props.localUse);
    setResearcherUser(props.researcherUser);
  }, [props.signingOfficial, props.checkCollaborator, props.itDirector, props.anvilUse, props.cloudUse, props.localUse, props.researcherUser, props.checkNihDataOnly]);


  return (
    div({ datacy: 'researcher-info' }, [
      h2('Step 1: Researcher Information'),

      div({className: 'dar-application-row'}, [
        h(FormField, {
          id: `researcher_name`,
          placeholder: 'Enter Firstname Lastname',
          title: '1.1 Researcher',
          validators: [FormValidators.REQUIRED],
          ariaLevel: ariaLevel + 1, onChange,
          defaultValue: researcherUser
        }),
      ]),

      div({className: 'dar-application-row'}, [
        h3('1.2 Researcher Identification'),
        div([
          'Please authenticate with ',
          a({href: 'https://public.era.nih.gov/commonsplus/public/login.era'}, ['eRA Commons ID'])
        ]),
        div({ className: 'flex-row', style: { justifyContent: 'flex-start', alignItems: 'flex-start' } }, [
          h4({ style: { marginRight: 30, marginTop: 30 } }, '1.2.1'),
          eRACommons({
            destination: eRACommonsDestination,
            onNihStatusUpdate: onNihStatusUpdate,
            location: location,
            validationError: showValidationMessages,
            header: true,
            onChange
          })
        ]),
        div({ className: 'flex-row', style: { justifyContent: 'flex-start' } }, [
          h4({ style: { marginRight: 30 } }, '1.2.2'),
          h(FormField, {
            id: `researcher-identification_NIH`,
            toggleText: span({ style: { fontSize: 14, fontWeight: 'bold' }}, ['I am exclusively applying for NIH data (ex. GTex)']),
            type: FormFieldTypes.CHECKBOX,
            ariaLevel: ariaLevel + 2, onChange,
            // defaultValue: formData[`researcher-identification_NIH`]
          })
        ]),
        div({ className: 'flex-row', style: { justifyContent: 'flex-start' } }, [
          h4({ style: { marginRight: 30 } }, '1.2.3'),
          h(FormField, {
            id: `researcher-identification_isNIHResearcher`,
            toggleText: span({ style: { fontSize: 14, fontWeight: 'bold' }}, ['I am an NIH intramural researcher (NIH email required)']),
            type: FormFieldTypes.CHECKBOX,
            ariaLevel: ariaLevel + 2, onChange,
            // defaultValue: formData[`researcher-identification_isNIHResearcher`]
          })
        ]),
      ]),

      div({className: 'dar-application-row'}, [
        h(FormField, {
          id: `principal_investigator`,
          description: 'I certify that the prinicpal investigator listed below is aware of this study',
          placeholder: 'Firstname Lastname',
          title: '1.3 Principal Investigator',
          validators: [FormValidators.REQUIRED],
          ariaLevel: ariaLevel + 1, onChange,
          // defaultValue: formData[`principal_investigator`]
        })
      ]),

      div({className: 'dar-application-row'}, [
        // TODO: DUOS-1753
        h3('1.4 Internal Lab Staff'),
        div(
          `Please add internal Lab Staff here. Internal Lab Staff are defined as users of data from
          this data access request, including any that are downloaded or utilized in the cloud. 
          please do not list External Collaborators or Internal Collaborators at a PI or equivalent 
          level here.`
        ),
        button({
          className: 'button button-white',
          style: { marginTop: 25 },
          onClick: () => {}
        }, ['Add Collaborator'])
      ]),

      div({className: 'dar-application-row'}, [
        // TODO: DUOS-1754
        h3('1.5 Internal Collaborators'),
        div(
          `Please add Internal Collaborators here Internal Collaborators are defined as individuals
          who are not under the direct supervision of the PI (e.g., not a member of the PI's 
          laboratory) who assists with the PI's research project involving controlled-access data 
          subject to the NIH GDS Policy. Internal collaborators are employees of the Requesting 
          PI's institution and work at the same location/campus as the PI. Internal Collaborators 
          must be at the PI or equivalent level and are required to have a Library Card in order 
          to access data through this request. Internal Collaborators will have Data 
          Downloader/Approver status so that they may add their own relevant Internal Lab Staff. 
          Internal Collaborators will not be required to submit an independent DAR to collaborate 
          on this project.`
        ),
        button({
          className: 'button button-white',
          style: { marginTop: 25 },
          onClick: () => {}
        }, ['Add Collaborator'])
      ]),

      div({className: 'dar-application-row'}, [
        h(FormField, {
          id: `institutional_signing_official`,
          description: 'I certify that the individual listed below is my Institutional Signing official',
          placeholder: 'Signing Official',
          title: '1.6 Institutional Signing Official',
          validators: [FormValidators.REQUIRED],
          ariaLevel: ariaLevel + 1, onChange,
          // defaultValue: formData[`institutional_signing_official`]
        }),
      ]),

      div({className: 'dar-application-row'}, [
        h(FormField, {
          id: `information_technology_director`,
          description: 'I certify that the individual listed below is my IT Director',
          placeholder: 'IT Director',
          title: '1.7 Information Technology (IT) Director',
          validators: [FormValidators.REQUIRED],
          ariaLevel: ariaLevel + 1, onChange,
          // defaultValue: formData[`information_technology_director`]
        })
      ]),

      div({className: 'dar-application-row'}, [
        h(FormField, {
          id: `cloud_use_statement`,
          description: [
            'Will you perform all of your data storage and analysis for this project on the ',
            a({href: 'https://anvilproject.org/'}, ['AnVIL']),
            '?'],
          title: '1.8 Cloud Use Statement*',
          // type: FormFieldTypes.RADIO,
          // radioOptions: [
          //   { value: 'yes', displayText: 'Yes' },
          //   { value: 'no', displayText: 'No' }
          // ],
          ariaLevel: ariaLevel + 1, onChange,
          // defaultValue: formData[`cloud_use_statement`]
        })
      ]),

      div({className: 'dar-application-row'}, [
        // TODO: DUOS-1754
        h3('1.9 External Collaborators'),
        div(
          `Please list External collaborators here. External Collaboratos are not employees of the 
          Requesting PI's institution and/or do not work at the same location as the PI, and 
          consequently must be independently approved to access controlled-access data subject to 
          the GDS Policy. External Collaborators must be at the PI or equivalent level and are not 
          required to have a Library Card in order to access data, although it is encouraged. Note: 
          External Collaborators must submit an independent DAR approved by their signing Official 
          to collaborate on this project. External Collaborators will be able to add their Lab Staff, 
          as needed, via their independent DAR. Approval of this DAR does not indicate approval of 
          the External Collaborators listed.`
        ),
        button({
          className: 'button button-white',
          style: { marginTop: 25 },
          onClick: () => {}
        }, ['Add Collaborator'])
      ])


    ])
  );
}
