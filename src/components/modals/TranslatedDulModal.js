import { ul } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import {GenerateUseRestrictionStatements} from '../TranslatedDULComponent';
import { useState, useEffect } from 'react';

const MODAL_ID = 'translatedDul';

const listStyle = {
  listStyle: 'none'
};

export default function TranslatedDulModal(props) {
  const OKHandler = () => {
    props.onOKRequest(MODAL_ID);
  };

  const closeHandler = () => {
    props.onCloseRequest(MODAL_ID);
  };

  const [translatedDULList, setTranslatedDULList] = useState(GenerateUseRestrictionStatements(props.dataUse || []));

  useEffect(() => {
    const getTranslatedDULList = async() => {
      const list = await GenerateUseRestrictionStatements(props.dataUse || []);
      setTranslatedDULList(list);
    };

    getTranslatedDULList();
  }, [props.dataUse]);

  return (
    BaseModal({
      id: 'translatedDulModal',
      showModal: props.showModal,
      onRequestClose: closeHandler,
      color: 'dataset',
      type: 'informative',
      iconSize: 'none',
      title: 'More information',
      description: 'Translated Use Restriction',
      action: { label: 'Close', handler: OKHandler }
    },
    [
      ul({style: listStyle, id: 'txt_translatedRestrictions', className: 'row no-margin translated-restriction'}, translatedDULList),
    ])
  );
}
