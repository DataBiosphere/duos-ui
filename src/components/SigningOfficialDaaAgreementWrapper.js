import { h, h2, a, p, div, span } from 'react-hyperscript-helpers';
import { Notifications } from '../libs/utils';
import BroadLibraryCardAgreementLink from '../assets/Library_Card_Agreement_2021.pdf';
import NIHLibraryCardAgreementLink from '../assets/NIH_Library_Card_Agreement_11_17_22_version.pdf';

import { User } from '../libs/ajax';
import Acknowledgments, {hasSOAcceptedDAAs} from '../libs/acknowledgements';
import { useEffect, useState } from 'react';
import { spinnerService } from '../libs/spinner-service';
import { isNil } from 'lodash';




export const SigningOfficialDaaAgreementWrapper = (props) => {
  const {
    onAccept,
    children
  } = props;

  const [hasAccepted, setHasAccepted] = useState();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const init = async() => {
      try {
        setIsLoading(true);
        setHasAccepted(await hasSOAcceptedDAAs());
        setIsLoading(false);
      } catch(error) {
        Notifications.showError({text: 'Error: Unable to retrieve current user from server'});
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const acceptDaas = async () => {
    await User.acceptAcknowledgments(Acknowledgments.broadLcaAcknowledgement, Acknowledgments.nihLcaAcknowledgement);
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

  return h(div, {}, [
    h(div, {
      isRendered: hasAccepted !== false,
    }, [
      children
    ]),
    h(div, {
      isRendered: hasAccepted === false,
    }, [

      h2({}, [
        'Agree to Library Card Terms',
      ]),

      p({
        style: {marginBottom: '20px'}
      }, [
        'To begin issuing Library Cards to researchers from your institution, please review the terms of both data access agreements below and click \'I agree\' when finished.'
      ]),


      div({style: { marginBottom: '25px', },}, [
        a({ target: '_blank', href: BroadLibraryCardAgreementLink, className: 'button button-white', }, [
          span({className: 'glyphicon glyphicon-download'}),
          ' Broad Library Card Agreement'
        ])
      ]),
      div({}, [
        a({ target: '_blank', href: NIHLibraryCardAgreementLink, className: 'button button-white' }, [
          span({className: 'glyphicon glyphicon-download'}),
          ' NIH Library Card Agreement'
        ])
      ]),

      div({ className: 'flex flex-row', style: { justifyContent: 'flex-end', }, }, [
        a({
          id: 'btn_save', onClick: acceptDaas,
          className: 'button button-blue',
          style: {
            marginRight: '2rem',
          }
        }, ['I Agree']),
      ]),
    ])
  ]);
};

export default SigningOfficialDaaAgreementWrapper;