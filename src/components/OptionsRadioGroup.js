import { PureComponent } from 'react';
import { div, input, hh, label, span } from 'react-hyperscript-helpers';
import PropTypes from 'prop-types';

export const OptionsRadioGroup = hh(class OptionsRadioGroup extends PureComponent {

  selectOption = (e, value) => {
    e.preventDefault();
    this.props.onChange(e, this.props.name, value);
  };

  render() {

    const { id, name, optionValues, optionLabels, value } = this.props;

    return (

      div({ className: 'radio-inline' }, [
        this.props.optionLabels.map((option, ix) => {
          return (

            label({
              key: id + ix,
              onClick: (e) => this.selectOption(e, optionValues[ix]),
              id: "lbl_" + this.props.id + "_" + ix,
              htmlFor: "rad_" + id + "_" + ix,
              className: "radio-wrapper"
            }, [
                input({
                  type: "radio",
                  id: "rad_" + id + "_" + ix,
                  name: name,
                  value: optionValues[ix],
                  checked: value === optionValues[ix],
                  onChange: () => { }
                }),
                span({ className: "radio-check" }),
                span({ className: "radio-label" }, [optionLabels[ix]])
              ])
          )
        })
      ])
    );
  }
});

OptionsRadioGroup.propTypes = {
  name: PropTypes.string,
  value: PropTypes.string,
  optionLabels: PropTypes.arrayOf(PropTypes.string),
  optionValues: PropTypes.array
};