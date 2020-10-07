import { ul } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import {GenerateUseRestrictionStatements} from '../TranslatedDULComponent';
// import { DataSet } from '../../libs/ajax'

const MODAL_ID = 'translatedDul';

const listStyle = {
  listStyle: 'none'
};

export default function TranslatedDulModal(props) {
  const OKHandler = (e) => {
    props.onOKRequest(MODAL_ID);
  };

  const closeHandler = (e) => {
    props.onCloseRequest(MODAL_ID);
  };

  const translatedDULList = GenerateUseRestrictionStatements(props.dataUse || {});

  return (
    BaseModal({
      id: "translatedDulModal",
      showModal: props.showModal,
      onRequestClose: closeHandler,
      color: "dataset",
      type: "informative",
      iconSize: 'none',
      title: "More information",
      description: 'Translated Use Restriction',
      action: { label: "Close", handler: OKHandler }
    },
    [
      ul({style: listStyle, id: "txt_translatedRestrictions", className: "row no-margin translated-restriction"}, [translatedDULList]),
    ])
  );
};
