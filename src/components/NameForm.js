import { React, Component } from 'react';
import { div, button, form, label, input, span, hh, br, h, hr, h4, a } from 'react-hyperscript-helpers';

export const NameForm = hh(class NameForm extends Component {
  constructor(props) {
    super(props);
    this.state = { value: '' };

    this.handleFirstNameChange = this.handleFirstNameChange.bind(this);
    this.handleLastNameChange = this.handleLastNameChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleFirstNameChange(event) {

    this.setState({ fname: event.target.value });
  }

  handleLastNameChange(event) {

    this.setState({ lname: event.target.value });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.onSubmit(this.state);
  }

  render() {
    return (
      form({ onSubmit: this.handleSubmit }, [
        input({ type: "text", value: this.state.fname, onChange: this.handleFirstNameChange, placeholder: "First Name" }),
        br({}),
        input({ type: "text", value: this.state.lname, onChange: this.handleLastNameChange, placeholder: "Last Name" }),
        br({}),
        input({ type: "submit", value: "Submit" }),
        br({}),
        "Hello, " + this.state.fname + ' ' + this.state.lname
      ])
    );
  }
});
