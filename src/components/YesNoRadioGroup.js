import { Component, } from 'react';
import { div, input, hh, label } from 'react-hyperscript-helpers';
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

        div({ style: { "display": "inline-block" }, onClick: (e) => this.selectOption(e, true) }, [
          input({
            className: "regular-radio",
            value: true,
            type: "radio",
            id: this.state.name + 'Yes',
            name: this.state.name,
            checked: this.state.value === true,
            onChange: this.handleChange
          }),
          label({ htmlFor: "RadioOptionYes" }, []),
          label({ htmlFor: "RadioOptionYes", className: "radio-button-text" }, ["Yes"]),
        ]),

        div({ style: { "display": "inline-block" }, onClick: (e) => this.selectOption(e, false) }, [
          input({
            className: "regular-radio",
            value: false,
            type: "radio",
            id: this.state.name + 'No',
            name: this.state.name,
            checked: this.state.value === false,
            onChange: this.handleChange
          }),
          label({ htmlFor: "RadioOptionNo" }, []),
          label({ htmlFor: "RadioOptionNo", className: "radio-button-text" }, ["No"]),
        ])
      ])
    );
  }
});

YesNoRadioGroup.propTypes = {
  name: PropTypes.string,
  value: PropTypes.bool
};