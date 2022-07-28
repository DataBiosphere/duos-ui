import { Component } from 'react';
import { div, hh, label, form } from 'react-hyperscript-helpers';
import {getPropertyValuesFromUser} from '../libs/utils';
import {isNil} from 'lodash/fp';
import { isEmpty } from 'lodash';

export const ResearcherReview = hh(class ResearcherReview extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      user: {},
      institution: {},
      researcherProperties: {
        eraCommonsId: '',
      },
    };
  }

  componentDidMount() {
    this.calculateResearcherInfo();
  }

  calculateResearcherInfo = () => {
    const user = this.props.user;
    let researcherProps = getPropertyValuesFromUser(user);
    this.setState(prev => {
      prev.user = user;
      prev.institution = !isEmpty(user.institution) ?  user.institution : null;
      prev.researcherProperties = researcherProps;
      return prev;
    });
  };

  componentDidUpdate(prevProps) {
    if (this.props.user !== prevProps.user) {
      this.setState({
        user: this.props.user
      });
    }
  }

  render() {
    const { researcherProperties, user, institution } = this.state;

    return (
      div({ className: 'container ' }, [
        div({ className: 'col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12 no-padding' }, [
          form({ name: 'researcherForm', noValidate: true }, [
            div({ className: 'row form-group margin-top-20' }, [
              div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
                label({ className: 'control-label' }, ['Full Name']),
                div({ id: 'lbl_profileName', className: 'control-data', name: 'profileName', readOnly: true }, [user.displayName])
              ]),
            ]),

            div({ className: 'row margin-top-20' }, [
              div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                label({ className: 'control-label rp-title-question default-color' }, ['Researcher Identification'])
              ])
            ]),

            div({ className: 'row no-margin' }, [
              div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
                label({ className: 'control-label' }, ['NIH User Name']),
                div({ id: 'lbl_profileeraCommonsId', className: 'control-data', name: 'profileeraCommonsId',  readOnly: true}, [researcherProperties.eraCommonsId]),
              ]),
              div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
                label({ className: 'control-label' }, ['Institution Name']),
                div({ id: 'lbl_profileInstitution', className: 'control-data', name: 'profileInstitution', readOnly: true}, [isNil(institution) ? '' : institution.name]),
              ])
            ]),
          ])
        ]),
      ])
    );
  }
});

export default ResearcherReview;
