import { div, input, label, span } from 'react-hyperscript-helpers';
import './RadioGroups.css';

export const OptionsRadioGroup = (props) => {

  const selectOption = (e, value) => {
    e.preventDefault();
    props.onChange(e, props.name, value);
  };

  const { id, name, optionValues, optionLabels, value } = props;

  return (

    div({ className: 'radio-inline' }, [
      optionLabels.map((option, ix) => {
        return (

          label({
            key: id + ix,
            onClick: (e) => selectOption(e, optionValues[ix]),
            id: 'lbl_' + props.id + '_' + ix,
            htmlFor: 'rad_' + id + '_' + ix,
            className: 'radio-wrapper'
          }, [
            input({
              type: 'radio',
              id: 'rad_' + id + '_' + ix,
              name: name,
              value: optionValues[ix],
              checked: value === optionValues[ix],
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
