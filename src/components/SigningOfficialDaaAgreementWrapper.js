import { Notifications } from '../libs/utils';
import BroadLibraryCardAgreementLink from '../assets/Library_Card_Agreement_2023_ApplicationVersion.pdf';
import NIHLibraryCardAgreementLink from '../assets/NIH_Library_Card_Agreement_11_17_22_version.pdf';
import DataSubmitterAgreementLink from '../assets/Data_Registrant_Agreement_7.2.24.22.pdf';
import Acknowledgments, {acceptAcknowledgments, hasSOAcceptedDAAs} from '../libs/acknowledgements';
import React, { useEffect, useState } from 'react';
import { spinnerService } from '../libs/spinner-service';
import { isNil, isNull } from 'lodash';
import { Styles } from '../libs/theme';
import UsgOmbText from './UsgOmbText';

export const SigningOfficialDaaAgreementWrapper = (props) => {
  const {
    onAccept,
    children,
    isDataSubmitterTab,
  } = props;

  const [hasAccepted, setHasAccepted] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const init = async() => {
      try {
        setIsLoading(true);
        setHasAccepted(await hasSOAcceptedDAAs());
        setIsLoading(false);
      } catch(error) {
        Notifications.showError({text: 'Error: Unable to retrieve user acknowledgements from server'});
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const acceptDaas = async () => {
    await acceptAcknowledgments(Acknowledgments.broadLcaAcknowledgement, Acknowledgments.nihLcaAcknowledgement);

    setHasAccepted(true);
    if (!isNil(onAccept)) {
      onAccept();
    }
  };

  useEffect(() => {
    if (isLoading) {
      spinnerService.showAll();
    } else {
      spinnerService.hideAll();
    }
  }, [isLoading]);

  return (
    <div style={Styles.PAGE}>
      {
        hasAccepted === true && (
          <div>
            {children}
          </div>
        )
      }
      {
        hasAccepted === false && (
          <div>
            <h2>
              Agree to {isDataSubmitterTab === true ? 'Data Submitter' : 'Library Card'} Terms
            </h2>
            <p style={{ marginBottom: '20px' }}>
              To begin issuing {isDataSubmitterTab === true ? 'Data Submitter privilege' : 'Library Card'}s to researchers from your institution, please review the terms of the data access agreement(s) below and click &apos;I agree&apos; when finished.
            </p>
            <div style={{ marginBottom: '25px' }}>
              {isDataSubmitterTab === true ?
                <a target='_blank' rel='noreferrer' href={DataSubmitterAgreementLink} className='button button-white'>
                  <span className='glyphicon glyphicon-download'/> DUOS Data Submitter Agreement
                </a> :
                <a target='_blank' rel='noreferrer' href={BroadLibraryCardAgreementLink} className='button button-white'>
                  <span className='glyphicon glyphicon-download'/> Broad Library Card Agreement
                </a>
              }
            </div>
            <div>
              {isDataSubmitterTab === true ? isNull :
                <a target='_blank' rel='noreferrer' href={NIHLibraryCardAgreementLink} className='button button-white'>
                  <span className='glyphicon glyphicon-download'/> NHGRI Library Card Agreement
                </a>
              }
            </div>
            <div className='flex flex-row' style={{ justifyContent: 'flex-end' }}>
              <button onClick={acceptDaas} className='button button-blue'>
                <span>
                 I AGREE
                </span>
              </button>
            </div>
          </div>
        )
      }
    </div>
  );
};

// Wraps component and ensures that SO agrees to the
// Broad and NIH agreements before proceeding to the given
// component.
export const ensureSoHasDaaAcknowledgement = (Component, isLibraryCardIssueTable = false, isDataSubmitterTab = false) => {
  const WrappedComponent = (props) => (
    <>
      <SigningOfficialDaaAgreementWrapper isDataSubmitterTab={isDataSubmitterTab}>
        <Component {...props} />
      </SigningOfficialDaaAgreementWrapper>
      {isLibraryCardIssueTable && <UsgOmbText />}
    </>
  );
  return WrappedComponent;
};

export default SigningOfficialDaaAgreementWrapper;