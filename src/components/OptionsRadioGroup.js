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
            span({ key: this.state.name + ix, onClick: (e) => this.selectOption(e, this.state.optionValues[ix]) }, [
              input({
                className: "regular-radio",
                value: this.state.optionValues[ix],
                type: "radio",
                id: "rad_" + this.props.id + ix,
                name: this.state.name,
                checked: this.state.value === this.state.optionValues[ix]
              }),
              label({ htmlFor: "rad_" + this.props.id + ix }, []),
              label({ id: "lbl_" + this.props.id + ix, htmlFor: "rad_" + this.props.id + ix, className: "radio-button-text" }, [this.state.optionLabels[ix]]),
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