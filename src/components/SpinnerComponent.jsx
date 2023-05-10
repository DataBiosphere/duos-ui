import * as React from 'react';
import { spinnerService } from '../libs/spinner-service';

// TODO: Delete this class
// Deprecated
export class SpinnerComponent extends React.Component {

  constructor(props, context) {
    super(props, context);

    if (!this.props.name) {
      throw new Error('Spinner components must have a name prop.');
    }

    if (!this.props.loadingImage && !this.props.children) {
      throw new Error('Spinner components must have either a loadingImage prop or children to display.');
    }

    this.state = {
      show: this.props.show || false
    };

    this.spinnerService = spinnerService;

    this.spinnerService._register(this);
  }

  get name() {
    return this.props.name;
  }

  get group() {
    return this.props.group;
  }

  get show() {
    return this.state.show;
  }

  set show(show) {
    this.setState({ show });
  }

  render() {
    let divStyle = { 'position': 'fixed', 'top': '30vh', 'left': '50vw', 'marginLeft': '-30px', 'zIndex': '10000' };
    if (this.state.show) {
      const { loadingImage } = this.props;
      return (
        <div style={divStyle}>
          {loadingImage && <img src={loadingImage} alt='spinner' />}
          {this.props.children}
        </div>
      );
    }
    return (<div style={divStyle}></div>);
  }
}
