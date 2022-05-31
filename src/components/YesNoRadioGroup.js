import { div, input, label, span } from 'react-hyperscript-helpers';
import isNil from 'lodash/fp/isNil';
import './RadioGroups.css';

export const YesNoRadioGroup = (props) => {

  const selectOption = (e, value) => {
    e.preventDefault();
    props.onChange(e, props.name, value);
  };

  const { id, name, optionValues = ['true', 'false'], optionLabels = ['Yes', 'No'], value, disabled } = props;
  const normValue = (value === 'true' || value === true || value === '1') ? 'true' :
    (value === 'false' || value === false || value === '0') ? 'false' : null;

  return (
    div({ className: 'radio-inline' }, [
      optionLabels.map((option, ix) => {
        return (

          label({
            key: id + ix,
            onClick: (e) => !isNil(props.onChange) && selectOption(e, optionValues[ix]),
            id: 'lbl_' + props.id + '_' + ix,
            htmlFor: 'rad_' + id + '_' + ix,
            className: 'radio-wrapper',
            style: disabled ? {opacity: 0.6, cursor: 'not-allowed'} : {}
          }, [
            input({
              type: 'radio',
              id: 'rad_' + id + '_' + ix,
              name: name,
              value: optionValues[ix],
              checked: normValue === optionValues[ix],
              onChange: () => { }
            }),
            span({ className: 'radio-check' }),
            span({ className: 'radio-label' }, [optionLabels[ix]])
          ])
        );
      })
    ])
  );
};
