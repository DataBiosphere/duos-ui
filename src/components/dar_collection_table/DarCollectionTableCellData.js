import {isNil} from "lodash/fp";
import {formatDate, isCollectionCanceled} from "../../libs/utils";
import {div, h} from "react-hyperscript-helpers";
import CancelCollectionButton from "./CancelCollectionButton";
import ResubmitCollectionButton from "./ResubmitCollectionButton";
import {styles} from "./DarCollectionTable";

export function projectTitleCellData({projectTitle = '- -', darCollectionId, label = 'project-title'}) {
  return {
    data: projectTitle,
    id: darCollectionId,
    style : {
      color: styles.color.projectTitle,
      fontSize: styles.fontSize.projectTitle
    },
    label
  };
}

export function darCodeCellData({darCode = '- -', darCollectionId, label = 'dar-code'}) {
  return {
    data: darCode,
    id: darCollectionId,
    style: {
      color: styles.color.darCode,
      fontSize: styles.fontSize.darCode,
      fontWeight: '500'
    },
    label
  };
}

export function submissionDateCellData({createDate, darCollectionId, label = 'submission-date'}) {
  return {
    data: isNil(createDate) ? '- - ' : formatDate(createDate),
    id: darCollectionId,
    style: {
      color: styles.color.submissionDate,
      fontSize: styles.fontSize.submissionDate
    },
    label
  };
}

export function piCellData({darCollectionId, pi, label = 'pi'}) {
  return {
    data: '--',
    id: darCollectionId,
    style: {
      color: styles.color.pi,
      fontSize: styles.fontSize.pi
    },
    label
  };
}

export function institutionCellData({institution = '- -', darCollectionId, label = 'institution'}) {
  return {
    data: institution,
    id: darCollectionId,
    style: {
      color: styles.color.institution,
      fontSize: styles.fontSize.institution
    },
    label
  };
}

export function datasetCountCellData({datasets = '- -', darCollectionId, label = 'datasets'}) {
  return {
    data: datasets.length,
    id: darCollectionId,
    style: {
      color: styles.color.datasetCount,
      fontSize: styles.fontSize.datasetCount
    },
    label
  };
}

export function statusCellData({status = '- -', darCollectionId, label = 'status'}) {
  return {
    data: status,
    id: darCollectionId,
    style: {
      color: styles.color.status,
      fontSize: styles.fontSize.status
    },
    label
  };
}


export function actionsCellData({collection, showConfirmationModal}) {
  const { darCollectionId } = collection;
  const cancel = {
    isComponent: true,
    id: darCollectionId,
    style: {
      color: styles.color.actions,
      fontSize: styles.fontSize.actions
    },
    label: 'cancel-button',
    data: div(
      {
        style: {
          display: 'flex',
          justifyContent: 'left'
        },
        key: `cancel-collection-cell-${darCollectionId}`
      },
      [h(CancelCollectionButton, {collection, showConfirmationModal})]
    )};
  const revise = {
    isComponent: true,
    id: darCollectionId,
    style: {
      color: styles.color.actions,
      fontSize: styles.fontSize.actions
    },
    label: 'resubmit-button',
    data: div(
      {
        style: {
          display: 'flex',
          justifyContent: 'left'
        },
        key: `resubmit-collection-cell-${darCollectionId}`
      },
      [h(ResubmitCollectionButton, {collection, showConfirmationModal})]
    )
  };

  return isCollectionCanceled(collection) ? revise : cancel;
}
