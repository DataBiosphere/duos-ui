import { div, h } from 'react-hyperscript-helpers';
import { Styles } from '../../libs/theme';
import Modal from 'react-modal';
import {isEmpty} from 'lodash/fp';
import {Alert} from '../Alert';

const ModalDetailRow = (props) => {
  return (
    div({style: Styles.MODAL.DAR_DETAIL_ROW}, [
      div({style: Styles.MODAL.DAR_LABEL}, [props.label]),
      div({style: Styles.MODAL.DAR_DETAIL}, [props.detail])
    ])
  );
};

const returnPIName = (havePI, isThePI, displayName, piName) => {
  let returnName;
  if(isThePI === "true") {
    returnName = displayName;
  }else if(havePI === "true") {
    returnName = piName;
  }
  return returnName || '- -';
};

const processResearchTypes = (researchTypes) => {
  let researchStatements = '';
  if(!isEmpty(researchTypes)) {
    researchStatements = researchTypes.map(type => {
      return `${type.description} ${type.manualReview ? 'Requires manual review.' : ''}`;
    });
  }
  return researchStatements;
};

const requiresManualReview = (darDetails) => {
  return darDetails.illegalBehavior ||
    darDetails.poa ||
    darDetails.psychiatricTraits ||
    darDetails.sexualDiseases ||
    darDetails.stigmatizedDiseases ||
    darDetails.vulnerablePopulation;
};

const DarModal = (props) => {
  //NOTE: Modal should be simple (raw information should be passed in as props) in order to ensure plug and play use
  const {showModal, closeModal, darDetails} = props;

  return h(Modal, {
    isOpen: showModal,
    onRequestClose: closeModal,
    shouldCloseOnOverlayClick: true,
    style: {
      content: {
        ...Styles.MODAL.CONTENT,
        ...{boxShadow: '3px 3px 0 #cccccc', borderRadius: "10px"}
      }
    }
  }, [
    div({style: Styles.MODAL.CONTENT}, [
      div({style: Styles.MODAL.TITLE_HEADER}, [`${darDetails.projectTitle}`]),
      div({style: { borderBottom: "1px solid #1F3B50" }}, []),
      h(ModalDetailRow, {
        label: 'Data Access Request Id',
        detail: darDetails.darCode
      }),
      h(ModalDetailRow, {
        label: 'Primary Investigator',
        detail: returnPIName(
          darDetails.havePi,
          darDetails.isThePi,
          darDetails.researcher,
          darDetails.investigator
        )
      }),
      h(ModalDetailRow, {
        label: 'Researcher',
        detail: darDetails.researcher || '- -'
      }),
      h(ModalDetailRow, {
        label: 'Institution',
        detail: darDetails.institution || '- -'
      }),
      h(ModalDetailRow, {
        label: 'Dataset(s)',
        detail: darDetails.datasetNames || '- -'
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