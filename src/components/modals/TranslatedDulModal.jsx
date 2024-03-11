import React from 'react';
import { BaseModal } from '../BaseModal';
import { useState, useEffect } from 'react';
import isEmpty from 'lodash/fp/isEmpty';
import {DataUseTranslation} from '../../libs/dataUseTranslation';

const MODAL_ID = 'translatedDulModal';

const listStyle = {
  listStyle: 'none'
};

//NOTE: li partial can be used in components that only need the list
async function GenerateUseRestrictionStatements(dataUse) {
  if (!dataUse || isEmpty(dataUse)) {
    return (
      <li key="restriction-none" className="translated-restriction">
        None
      </li>
    );
  }
  const translations = await DataUseTranslation.translateDataUseRestrictions(dataUse);
  return translations.map((restriction) => {
    return (
      <li key={`${restriction.code}-statement`} className="translated-restriction">
        <span style={{fontWeight: 'bold'}}>{restriction.code}: </span>
        {restriction.description}
      </li>
    );
  });
}

export default function TranslatedDulModal(props) {
  const { showModal, onCloseRequest, dataUse } = props;

  const [translatedDulList, setTranslatedDulList] = useState([]);

  const closeHandler = () => {
    onCloseRequest(MODAL_ID);
  };

  useEffect(() => {
    const getTranslatedDulList = async () => {
      const dulList = await GenerateUseRestrictionStatements(dataUse || []);
      setTranslatedDulList(dulList);
    };

    getTranslatedDulList();
  }, [dataUse]);

  return (
    BaseModal({
      id: MODAL_ID,
      showModal: showModal,
      onRequestClose: closeHandler,
      color: 'dataset',
      type: 'informative',
      iconSize: 'none',
      title: 'Data Use Terms',
      action: { label: 'Close', handler: closeHandler }
    },
    [
      <ul key='dulUnorderedList' style={listStyle} id="txt_translatedRestrictions" className="row no-margin translated-restriction">
        {translatedDulList}
      </ul>
    ])
  );
}
