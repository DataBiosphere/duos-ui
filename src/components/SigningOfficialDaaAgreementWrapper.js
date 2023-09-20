import { h, h2, a, p, div, span, button } from 'react-hyperscript-helpers';
import { Notifications } from '../libs/utils';
import BroadLibraryCardAgreementLink from '../assets/Library_Card_Agreement_2023_ApplicationVersion.pdf';
import NIHLibraryCardAgreementLink from '../assets/NIH_Library_Card_Agreement_11_17_22_version.pdf';
import DataSubmitterAgreementLink from '../assets/Data_Registrant_Agreement_7.2.24.22.pdf';
import Acknowledgments, {acceptAcknowledgments, hasSOAcceptedDAAs} from '../libs/acknowledgements';
import { useEffect, useState } from 'react';
import { spinnerService } from '../libs/spinner-service';
import { isNil, isNull } from 'lodash';
import { Styles } from '../libs/theme';

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

  return h(div, {style: Styles.PAGE}, [
    h(div, {
      isRendered: hasAccepted === true,
    }, [
      children
    ]),
    h(div, {
      isRendered: hasAccepted === false,
    }, [

      h2({}, [
        'Agree to ' + (isDataSubmitterTab === true ? 'Data Submitter' : 'Library Card') + ' Terms'
      ]),

      p({
        style: {marginBottom: '20px'}
      }, [
        'To begin issuing ' + (isDataSubmitterTab === true ? 'Data Submitter privilege' : 'Library Card') + 's to researchers from your institution, please review the terms of the data access agreement(s) below and click \'I agree\' when finished.'
      ]),


      div({style: { marginBottom: '25px', },}, [isDataSubmitterTab === true ?
        a({target: '_blank', href: DataSubmitterAgreementLink, className: 'button button-white', }, [
          span({className: 'glyphicon glyphicon-download'}),
          ' DUOS Data Submitter Agreement'
        ]) :
        a({ target: '_blank', href: BroadLibraryCardAgreementLink, className: 'button button-white', }, [
          span({className: 'glyphicon glyphicon-download'}),
          ' Broad Library Card Agreement'
        ])
      ]),
      div({}, [isDataSubmitterTab === true ? isNull :
        a({ target: '_blank', href: NIHLibraryCardAgreementLink, className: 'button button-white' }, [
          span({className: 'glyphicon glyphicon-download'}),
          ' NHGRI Library Card Agreement'
        ])
      ]),

      div({ className: 'flex flex-row', style: { justifyContent: 'flex-end', }, }, [
        button({onClick: acceptDaas, className: 'button button-blue'},[span({},), 'I AGREE']),
      ]),
    ])
  ]);
};

// Wraps component and ensures that SO agrees to the
// Broad and NIH agreements before proceeding to the given
// component.
export const ensureSoHasDaaAcknowledgement = (component, isLibraryCardIssueTable = false, isDataSubmitterTab = false) => {
  return (props) => (
    div({}, [
      h(SigningOfficialDaaAgreementWrapper, { isDataSubmitterTab }, [
        h(component, props),
      ]),
      isLibraryCardIssueTable && div({ style: { marginTop: '50px', background: '#eee', padding: '20px' } }, [
        p({}, ['OMB No.: 0925-7775']),
        p({}, ['Expiration Date: 06/30/2025']),
        p({}, ['Public reporting burden for this collection of information is estimated to average 45 minutes per response, including the time for reviewing instructions, searching existing data sources, gathering and maintaining the data needed, and completing and reviewing the collection of information. An agency may not conduct or sponsor, and a person is not required to respond to, a collection of information unless it displays a currently valid OMB control number. Send comments regarding this burden estimate or any other aspect of this collection of information, including suggestions for reducing this burden to: NIH, Project Clearance Branch, 6705 Rockledge Drive, MSC 7974, Bethesda, MD 20892-7974, ATTN: PRA (0925-7775). Do not return the completed form to this address.']),
      ])
    ]));
};

export default SigningOfficialDaaAgreementWrapper;