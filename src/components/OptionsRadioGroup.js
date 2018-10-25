import { Component } from 'react';
import { div, input, hh, label, span } from 'react-hyperscript-helpers';
import PropTypes from 'prop-types';

export const OptionsRadioGroup = hh(class OptionsRadioGroup extends Component {

  // constructor(props) {
  //   super(props);
  //   this.state = {
  //     name: this.props.name,
  //     value: this.props.value, //this.fixValue(this.props.value),
  //     optionLabels: this.props.optionLabels,
  //     optionValues: this.props.optionValues
  //   }
  // }

  // fixValue(value) {
  //   if (value === false) return '0';
  //   if (value === true) return '1';
  //   if (value === null) return '2';
  // }

  // static getDerivedStateFromProps(nextProps, prevState) {
  //   let newValue = nextProps.value === false ? '0' :
  //   nextProps.value === true ? '1' : '2';
  //     return {
  //       rationale: nextProps.rationale,
  //       value: newValue
  //     };
  //   }

  selectOption = (e, value) => {
    // this.setState(prev => {
    //   prev.value = value;
    //   return prev;
    // }, () => {
    console.log(value, e.target.value);
      this.props.onChange(e, this.props.name, value);
    // });
  };

  render() {
    console.log(this.props);
    return (

      div({ className: 'radio-inline' }, [
        this.props.optionLabels.map((option, ix) => {
          return (

            label({
              key: this.props.id + ix,
              onClick: (e) => this.selectOption(e, this.props.optionValues[ix]),
              id: "lbl_" + this.props.id + "_" + ix,
              htmlFor: "rad_" + this.props.id + "_" + ix,
              className: "radio-wrapper"
            }, [
                input({
                  type: "radio",
                  id: "rad_" + this.props.id + "_" + ix,
                  name: this.props.name,
                  // value: this.state.optionValues[ix],
                  checked: this.props.value === this.props.optionValues[ix] ,
                }),
                span({ className: "radio-check" }),
                span({ className: "radio-label" }, [this.props.optionLabels[ix]])
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