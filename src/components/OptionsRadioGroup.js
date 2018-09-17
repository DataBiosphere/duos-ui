import { Component } from 'react';
import { div, input, hh, label, span } from 'react-hyperscript-helpers';
import PropTypes from 'prop-types';

export const OptionsRadioGroup = hh(class OptionsRadioGroup extends Component {

  constructor(props) {
    super(props);
    this.state = {
      name: this.props.name,
      value: this.props.value,
      optionLabels: this.props.optionLabels,
      optionValues: this.props.optionValues
    }
  }

  selectOption = (e, value) => {
    this.setState(prev => {
      prev.value = value;
      return prev;
    }, () => {
      this.props.onChange(e, this.state.name, value);
    });
  }

  render() {

    return (

      div({ className: 'radio-inline' }, [
        this.state.optionLabels.map((option, ix) => {
          return (

            label({
              key: this.state.name + ix,
              onClick: (e) => this.selectOption(e, this.state.optionValues[ix]),
              id: "lbl_" + this.state.name + ix,
              htmlFor: "rad_" + this.state.name + ix,
              className: "radio-wrapper"
            }, [
                input({
                  type: "radio",
                  id: "rad_" + this.state.name + ix,
                  name: this.state.name,
                  value: this.state.optionValues[ix],
                  checked: this.state.value === this.state.optionValues[ix],
                }),
                span({ className: "radio-check" }),
                span({ className: "radio-label" }, [this.state.optionLabels[ix]])
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