import {div, h} from 'react-hyperscript-helpers';
import {Alert} from '../Alert';
import {Styles} from '../../libs/theme';
import Modal from 'react-modal';
import {find, isEmpty, isNil} from 'lodash/fp';
import CloseIconComponent from '../CloseIconComponent';
import {useEffect, useState} from 'react';

const ModalDetailRow = (props) => {
  return (
    div({style: Styles.MODAL.DAR_DETAIL_ROW}, [
      div({style: Styles.MODAL.DAR_LABEL}, [props.label]),
      div({style: Styles.MODAL.DAR_DETAIL}, [props.detail])
    ])
  );
};

const getDatasets = (darDetails, datasets) => {
  return isNil(darDetails) ? [] : isNil(datasets) ? darDetails.datasetNames : datasets;
};

const returnPIName = (researcher) => {
  const properties = researcher.researcherProperties;
  const isThePI = !isNil(find({propertyKey: 'isThePI', propertyValue: true})(properties));
  const havePI = !isNil(find({propertyKey: 'havePI', propertyValue: true})(properties));
  let returnName;
  if (isThePI) {
    returnName = researcher.displayName;
  } else if (havePI) {
    const piNameProp = find({propertyKey: 'piName'})(properties);
    returnName = piNameProp.propertyValue;
  }
  return returnName || researcher.displayName;
};


const processResearchTypes = (researchTypes) => {
  let researchStatements = '';
  if(!isEmpty(researchTypes)) {
    researchStatements = researchTypes.map(type => {
      return `${type.description}`;
    });
  }
  return researchStatements;
};

const requiresManualReview = (darDetails) => {
  return (isNil(darDetails.requiresManualReview)) ?
    (darDetails.illegalBehavior ||
    darDetails.poa ||
    darDetails.psychiatricTraits ||
    darDetails.sexualDiseases ||
    darDetails.stigmatizedDiseases ||
    darDetails.vulnerablePopulation)
    : darDetails.requiresManualReview;
};

const DarModal = (props) => {
  //NOTE: Modal should be simple (raw information should be passed in as props) in order to ensure plug and play use
  const {showModal, closeModal, darDetails, datasets, researcher} = props;
  const [institution, setInstitution] = useState();

  useEffect(() => {

    const returnInstitution = async (researcher) => {
      if (isEmpty(researcher.institution)) {
        setInstitution('- -');
      } else {
        setInstitution(researcher.institution.name);
      }
    };
    returnInstitution(researcher);
  }, [researcher]);

  return h(Modal, {
    isOpen: showModal,
    onRequestClose: closeModal,
    shouldCloseOnOverlayClick: true,
    style: {
      content: {...Styles.MODAL.CONTENT},
      overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }
    }
  }, [
    div({style: Styles.MODAL.CONTENT}, [
      h(CloseIconComponent, {closeFn: closeModal}),
      div({style: Styles.MODAL.TITLE_HEADER}, [`${darDetails.projectTitle}`]),
      div({style: {borderBottom: '1px solid #1F3B50'}}, []),
      h(ModalDetailRow, {
        label: 'Data Access Request Id',
        detail: darDetails.darCode
      }),
      h(ModalDetailRow, {
        label: 'Primary Investigator',
        detail: returnPIName(researcher)
      }),
      h(ModalDetailRow, {
        label: 'Researcher',
        detail: researcher.displayName || '- -'
      }),
      h(ModalDetailRow, {
        label: 'Institution',
        detail: institution
      }),
      h(ModalDetailRow, {
        label: 'Dataset(s)',
        detail: getDatasets(darDetails, datasets)
      }),
      h(ModalDetailRow, {
        label: 'Type of Research',
        detail: processResearchTypes(darDetails.researchType)
      }),
      div({
        isRendered: requiresManualReview(darDetails),
        style: Styles.ALERT
      }, [
        Alert({
          id: 'purposeStatementManualReview', type: 'danger',
          title: 'This research involves studying a sensitive population and requires manual review.'
        })
      ])
    ])
  ]);
};

export default DarModal;