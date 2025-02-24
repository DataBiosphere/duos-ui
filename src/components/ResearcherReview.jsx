import React, {useState, useEffect} from 'react';
import {getPropertyValuesFromUser} from '../libs/utils';
import {isNil} from 'lodash/fp';
import { isEmpty } from 'lodash';

export const ResearcherReview = (props) => {
  const [state, setState] = useState({
    value: '',
    user: {},
    institution: {},
    properties: {
      eraCommonsId: ''
    }
  });

  useEffect(() => {
    const user = props.user;
    let userProps = getPropertyValuesFromUser(user);
    setState((prev) => ({
      ...prev,
      user: user,
      institution: !isEmpty(user.institution) ? user.institution : null,
      properties: userProps
    }));
  }, [props.user]);

  const { properties, user, institution } = state;

  return (
    <div className="container">
      <div className="col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12 no-padding">
        <form name="researcherForm" noValidate={true}>
          <div className="row form-group margin-top-20">
            <div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
              <label className="control-label">Full Name</label>
              <div id="lbl_profileName" className="control-data" name="profileName" readOnly={true}>
                {user.displayName}
              </div>
            </div>
          </div>

          <div className="row margin-top-20">
            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
              <label className="control-label rp-title-question default-color">Researcher Identification</label>
            </div>
          </div>

          <div className="row no-margin">
            <div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
              <label className="control-label">NIH User Name</label>
              <div id="lbl_profileeraCommonsId" className="control-data" name="profileeraCommonsId" readOnly={true}>
                {properties.eraCommonsId}
              </div>
            </div>
            <div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
              <label className="control-label">Institution Name</label>
              <div id="lbl_profileInstitution" className="control-data" name="profileInstitution" readOnly={true}>
                {isNil(institution) ? '' : institution.name}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResearcherReview;
