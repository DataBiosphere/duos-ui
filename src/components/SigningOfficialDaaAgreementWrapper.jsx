import React, { useEffect, useState } from 'react';
import { isNil, isNull } from 'lodash';
import { Notifications } from 'src/libs/utils';
import BroadLibraryCardAgreementLink from 'src/assets/Library_Card_Agreement_2023_ApplicationVersion.pdf';
import NihLibraryCardAgreementLink from 'src/assets/NIHLibraryCardAgreement06252025.pdf';
import DataSubmitterAgreementLink from 'src/assets/Data_Registrant_Agreement_7.2.24.22.pdf';
import Acknowledgments, {acceptAcknowledgments, hasSOAcceptedDAAs} from 'src/libs/acknowledgements';
import { spinnerService } from 'src/libs/spinner-service';
import { Styles } from 'src/libs/theme';
import {
  NIHDataUseCertificationAgreement
} from 'src/components/external_docs/NIHDataUseCertificationAgreement';

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
      } catch(_error) {
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
                  <div>
                    <div style={{ marginBottom: '25px' }}>
                      <a target='_blank' rel='noreferrer' href={NihLibraryCardAgreementLink} className='button button-white'>
                        <span className='glyphicon glyphicon-download'/> NIH Library Card Agreement
                      </a>
                    </div>
                  <NIHDataUseCertificationAgreement className={'button button-white'} showDownloadIcon={true}/>
                  </div>
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
  const _ignored = isLibraryCardIssueTable;
  const WrappedComponent = (props) => (
    <>
      <SigningOfficialDaaAgreementWrapper isDataSubmitterTab={isDataSubmitterTab}>
        <Component {...props} />
      </SigningOfficialDaaAgreementWrapper>
    </>
  );
  return WrappedComponent;
};

export default SigningOfficialDaaAgreementWrapper;
