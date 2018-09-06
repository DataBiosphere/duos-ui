import { Component, } from 'react';
import { div, input, hh, label, span } from 'react-hyperscript-helpers';
import PropTypes from 'prop-types';

export const YesNoRadioGroup = hh(class YesNoRadioGroup extends Component {

  constructor(props) {
    super(props);
    this.state = {
      name: this.props.name,
      value: this.props.value
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

  handleChange = (e) => {
    // do nothing 
  }

  render() {

    return (

      div({ className: 'radio-inline' }, [
        span({ onClick: (e) => this.selectOption(e, true) }, [
          input({
            className: "regular-radio",
            value: true,
            type: "radio",
            id: "rad_positive_" + this.props.id,
            name: this.state.name,
            checked: this.state.value === true,
            onChange: this.handleChange
          }),
          label({ htmlFor: "rad_positive_" + this.props.id }, []),
          label({ id: "lbl_positive_" + this.props.id, htmlFor: "rad_positive_" + this.props.id, className: "radio-button-text" }, ["Yes"]),
        ]),

        span({ onClick: (e) => this.selectOption(e, false) }, [
          input({
            className: "regular-radio",
            value: false,
            type: "radio",
            id: "rad_negative_" + this.props.id,
            name: this.state.name,
            checked: this.state.value === false,
            onChange: this.handleChange
          }),
          label({ htmlFor: "rad_negative_" + this.props.id }, []),
          label({ id: "lbl_negative_" + this.props.id, htmlFor: "rad_negative_" + this.props.id, className: "radio-button-text" }, ["No"]),
        ])
      ])
    );
  }
});

YesNoRadioGroup.propTypes = {
  name: PropTypes.string,
  value: PropTypes.bool
};