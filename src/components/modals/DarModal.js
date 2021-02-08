import {div, h} from 'react-hyperscript-helpers';
import { Alert } from '../Alert';
import { User } from '../../libs/ajax';
import { Styles } from '../../libs/theme';
import { Notifications } from '../../libs/utils';
import Modal from 'react-modal';
import {find, isEmpty, isNil} from 'lodash/fp';
import {useEffect, useState} from 'react';

const ModalDetailRow = (props) => {
  return (
    div({style: Styles.MODAL.DAR_DETAIL_ROW}, [
      div({style: Styles.MODAL.DAR_LABEL}, [props.label]),
      div({style: Styles.MODAL.DAR_DETAIL}, [props.detail])
    ])
  );
};

const returnPIName = (researcher) => {
  const properties = researcher.researcherProperties;
  const isThePI = !isNil(find({propertyKey: "isThePI", propertyValue: true})(properties));
  const havePI = !isNil(find({propertyKey: "havePI", propertyValue: true})(properties));
  let returnName;
  if (isThePI) {
    returnName = researcher.displayName;
  } else if (havePI) {
    const piNameProp = find({propertyKey: "piName"})(properties);
    returnName = piNameProp.propertyValue;
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

const getResearcher = async (userId) => {
  return await User.getById(userId);
};

const DarModal = (props) => {
  //NOTE: Modal should be simple (raw information should be passed in as props) in order to ensure plug and play use
  const {showModal, closeModal, darDetails} = props;

  const [researcher, setResearcher] = useState([]);
  useEffect(() => {
    const init = async() => {
      try {
        if (!isNil(darDetails.userId)) {
          const researcher = await getResearcher(darDetails.userId);
          setResearcher(researcher);
        }
      } catch(error) {
        Notifications.showError({text: 'Error: Unable to retrieve researcher information'});
      }
    };
    init();
  }, []);

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
        detail: returnPIName(researcher)
      }),
      h(ModalDetailRow, {
        label: 'Researcher',
        detail: researcher.displayName || '- -'
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