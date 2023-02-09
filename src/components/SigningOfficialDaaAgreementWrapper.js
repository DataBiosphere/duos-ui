import { h, h2, a, p, div, span, button } from 'react-hyperscript-helpers';
import { Notifications } from '../libs/utils';
import BroadLibraryCardAgreementLink from '../assets/Library_Card_Agreement_2021.pdf';
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
    isDataSubmitter,
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
        'Agree to ' + (isDataSubmitter === true ? 'Data Submitter' : 'Library Card') + ' Terms'
      ]),

      p({
        style: {marginBottom: '20px'}
      }, [
        'To begin issuing ' + (isDataSubmitter === true ? 'Data Submitter privilege' : 'Library Card') + 's to researchers from your institution, please review the terms of the data access agreement(s) below and click \'I agree\' when finished.'
      ]),


      div({style: { marginBottom: '25px', },}, [isDataSubmitter === true ?
        a({target: '_blank', href: DataSubmitterAgreementLink, className: 'button button-white', }, [
          span({className: 'glyphicon glyphicon-download'}),
          ' DUOS Data Submitter Agreement'
        ]) :
        a({ target: '_blank', href: BroadLibraryCardAgreementLink, className: 'button button-white', }, [
          span({className: 'glyphicon glyphicon-download'}),
          ' Broad Library Card Agreement'
        ])
      ]),
      div({}, [isDataSubmitter === true ? isNull :
        a({ target: '_blank', href: NIHLibraryCardAgreementLink, className: 'button button-white' }, [
          span({className: 'glyphicon glyphicon-download'}),
          ' NIH Library Card Agreement'
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
export const ensureSoHasDaaAcknowledgement = (component, isDataSubmitter=false) => {
  return (props) => h(SigningOfficialDaaAgreementWrapper, {isDataSubmitter}, [
    h(component, props),
  ]);
};

export default SigningOfficialDaaAgreementWrapper;