import {useEffect, useState} from 'react';
import { div, li, h4, a, ul} from 'react-hyperscript-helpers';
import {DataUseTranslation} from '../libs/dataUseTranslation';
import isEmpty from 'lodash/fp/isEmpty';
import * as Utils from '../libs/utils';
import isNil from 'lodash/fp/isNil';

const DULPanel = {
  margin: '0.5rem',
  flex: 1,
  boxShadow: 'rgba(0, 0, 0, 0.14) 3px 3px 3px 1px',
  border: '1px solid #f5f5f5',
  borderRadius: '5px'
};

const DULContainer = {
  display: 'flex',
  padding: '0 1.1rem'
};

//NOTE: li partial can be used in components that only need the list
export async function GenerateUseRestrictionStatements(dataUse) {
  if (!dataUse || isEmpty(dataUse)) {
    return [li({
      className: 'translated restriction',
      key: 'restriction-none'
    }, ['None'])];
  }
  const translations = await DataUseTranslation.translateDataUseRestrictions(dataUse);
  return translations.map((restriction) => {
    return li({
      className: 'translated-restriction',
      key: `${restriction.code}-statement`,
    }, [restriction.description]);
  });
}

//component generation for non AccessReviewV2 components
//template structure is different between DAR and DUL due to differing grid organization in previous template, making it hard to convert
//task is not impossible, just requires additional time
export default function TranslatedDULComponent(props) {
  const [translatedDULStatements, setTranslatedDULStatements] = useState([]);

  useEffect(() => {
    const generatedRestrictions = async (restrictions) => {
      const updatedStatements = await GenerateUseRestrictionStatements(restrictions);
      setTranslatedDULStatements(updatedStatements);
    };
    generatedRestrictions(props.restrictions);
  }, [props.restrictions, setTranslatedDULStatements]);

  const machineReadableLink = a({
    id: 'btn_downloadSDul',
    onClick: () => Utils.download('machine-readable-DUL.json', props.mrDUL),
    filename: 'machine-readable-DUL.json',
    value: props.mrDUL,
    className: 'italic hover-color',
  }, ['Download DUL machine-readable format']);

  //panel formats differ depending on whether or not its used in DAR vs DUL

  const DARTemplate = div({ className: 'data-use-container' }, [
    div({ className: 'panel-heading cm-boxhead dul-color' }, [
      h4({}, ['Data Use Limitations']),
    ]),
    ul({ id: 'panel_dataUseLimitations', className: 'panel-body cm-boxbody translated-restriction', style: {listStyle: 'none', marginTop: '0.8rem'}}, [translatedDULStatements]),
    div({id: 'panel_mrlLink panel-body', className: 'panel-body cm-boxbody translated-restriction', isRendered: !isNil(props.mrDUL)},[machineReadableLink])
  ]);

  const DULTemplate =
    div({style: DULContainer}, [
      div({className: 'data-use-panel', style: DULPanel}, [
        div({ className: 'panel-heading cm-boxhead dul-color' }, [
          h4({}, ['Data Use Limitations']),
        ]),
        div({id: 'panel_mrlLink panel-body', className: 'panel-body cm-boxbody translated-restriction', isRendered: !isNil(props.mrDUL)},[machineReadableLink])
      ]),
      div({ className: 'data-use-panel', style: DULPanel }, [
        div({ className: 'panel-heading cm-boxhead dul-color' }, [
          h4({}, ['Structured Limitations']),
        ]),
        ul({ id: 'panel_dataUseLimitations', className: 'panel-body cm-boxbody translated-restriction', style: {listStyle: 'none'}}, [translatedDULStatements]),
      ])
    ]);

  const output = props.isDUL ? DULTemplate : DARTemplate;

  return output;
}
