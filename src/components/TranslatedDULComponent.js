import { div, ul, li, h4, button } from 'react-hyperscript-helpers';
import {DataUseTranslation} from '../libs/dataUseTranslation';
import isEmpty from 'lodash/fp/isEmpty';
import * as Utils from '../libs/utils';
import isNil from 'lodash/fp/isNil';

//NOTE: li partial can be used in components that only need the list
export const generateUseRestrictionStatements = (dataUse) => {
  if (!dataUse || isEmpty(dataUse)) {
    return [li({
      className: 'response-label translated restriction',
      key: 'restriction-none'
    }, ['None'])];
  }
  return DataUseTranslation.translateDataUseRestrictions(dataUse)
    .map((restriction) => {
      return li({
        className: 'response-label translated-restriction',
        key: `${restriction.code}-statement`
      }, [restriction.description]);
    });
};

export default function TranslatedDULComponent(props) {
  const mrDULPartial = !isNil(props.mrDUL) ? button({
    id: 'btn_downloadSDul',
    onClick: () => Utils.download('machine-readable-DUL.json', props.mrDUL),
    filename: 'machine-readable-DUL.json',
    value: props.mrDUL,
    className: 'btn-secondary btn-download-pdf hover-color'
  }, ['Download DUL machine-readable format']) : '';


  const translatedDULStatements = generateUseRestrictionStatements(props.restrictions, props.mDUL);

  return (
    div({className: 'translated-dul-component-container'}, [
      div({ className: 'panel-heading cm-boxhead dul-color' }, [
        h4({}, ['Data Use Limitations'])
      ]),
      div({ id: 'panel_dul', className: 'panel-body cm-boxbody' }, [
        div({ className: 'row dar-summary' }, [
          div({ className: 'control-label dul-color' }, ['Structured Limitations']),
          ul({className: 'response-label translated-restriction'}, [translatedDULStatements]),
          mrDULPartial
        ])
      ])
    ])
  );
}