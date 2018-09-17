import { Component, } from 'react';
import { div, input, hh, label, span } from 'react-hyperscript-helpers';
import PropTypes from 'prop-types';
import './RadioGroups.css';

export const YesNoRadioGroup = hh(class YesNoRadioGroup extends Component {

  handleChange = (changeEvent) => {
    this.props.onChange(changeEvent, this.props.name, changeEvent.target.value)
  };

  render() {

    const { id, name, value } = this.props;

    return (

      div({ className: 'radio-inline' }, [
        label({ id: "lbl_positive_" + id, htmlFor: "rad_positive_" + id, className: "radio-wrapper" }, [
          input({
            value: 'true',
            type: "radio",
            id: "rad_positive_" + id,
            name: name,
            checked: value === 'true' || value === true || value === '1',
            onChange: this.handleChange
          }),
          span({ className: "radio-check" }),
          span({ className: "radio-label" }, ["Yes"])
        ]),
        label({ id: "lbl_negative_" + id, htmlFor: "rad_negative_" + id, className: "radio-wrapper" }, [
          input({
            value: 'false',
            type: "radio",
            id: "rad_negative_" + id,
            name: name,
            checked: value === 'false' || value === false || value === '0',
            onChange: this.handleChange
          }),
          span({ className: "radio-check" }),
          span({ className: "radio-label" }, ["No"])
        ])
      ])
    );
  }
});

YesNoRadioGroup.PropTypes = {
  name: PropTypes.string,
  value: PropTypes.bool
};