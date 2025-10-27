import React from 'react'
import { isNull } from 'lodash'
import { Notifications } from 'src/libs/utils'
import BroadLibraryCardAgreementLink from 'src/assets/Library_Card_Agreement_2023_ApplicationVersion.pdf'
import NihLibraryCardAgreementLink from 'src/assets/NIHLibraryCardAgreement06252025.pdf'
import DataSubmitterAgreementLink from 'src/assets/Data_Registrant_Agreement_7.2.24.22.pdf'
import Acknowledgments, { acceptAcknowledgments } from 'src/libs/acknowledgements'
import { Styles } from 'src/libs/theme'
import { NIHDataUseCertificationAgreement } from 'src/components/external_docs/NIHDataUseCertificationAgreement'
import { extractError } from 'src/utils/ErrorUtils.ts'

export const SigningOfficialDaaAgreementWrapper = (props) => {
  const {
    isDataSubmitterTab,
  } = props

  const acceptDaas = async () => {
    try {
      await acceptAcknowledgments(Acknowledgments.broadLcaAcknowledgement, Acknowledgments.nihLcaAcknowledgement)
      window.location = '/signing_official_console/library_cards'
    }
    catch (error) {
      const message = extractError(error)
      Notifications.showError({ text: 'Error: Unable to accept data access agreements: ' + message })
    }
  }

  return (
    <div style={Styles.PAGE}>
      <div>
        <h2>
          Agree to
          {' '}
          {isDataSubmitterTab === true ? 'Data Submitter' : 'Library Card'}
          {' '}
          Terms
        </h2>
        <p style={{ marginBottom: '20px' }}>
          To begin issuing
          {' '}
          {isDataSubmitterTab === true ? 'Data Submitter privilege' : 'Library Card'}
          s to researchers from your institution, please review the terms of the data access agreement(s) below and click &apos;I agree&apos; when finished.
        </p>
        <div style={{ marginBottom: '25px' }}>
          {isDataSubmitterTab === true
            ? (
                <a target="_blank" rel="noreferrer" href={DataSubmitterAgreementLink} className="button button-white">
                  <span className="glyphicon glyphicon-download" />
                  {' '}
                  DUOS Data Submitter Agreement
                </a>
              )
            : (
                <a target="_blank" rel="noreferrer" href={BroadLibraryCardAgreementLink} className="button button-white">
                  <span className="glyphicon glyphicon-download" />
                  {' '}
                  Broad Library Card Agreement
                </a>
              )}
        </div>
        <div>
          {isDataSubmitterTab === true
            ? isNull
            : (
                <div>
                  <div style={{ marginBottom: '25px' }}>
                    <a target="_blank" rel="noreferrer" href={NihLibraryCardAgreementLink} className="button button-white">
                      <span className="glyphicon glyphicon-download" />
                      {' '}
                      NIH Library Card Agreement
                    </a>
                  </div>
                  <NIHDataUseCertificationAgreement className="button button-white" showDownloadIcon={true} />
                </div>
              )}
        </div>
        <div className="flex flex-row" style={{ justifyContent: 'flex-end' }}>
          <button onClick={acceptDaas} className="button button-blue">
            <span>
              I AGREE
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default SigningOfficialDaaAgreementWrapper
