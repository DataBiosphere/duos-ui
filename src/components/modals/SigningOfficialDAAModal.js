import { h, h2, a, p, div, span } from 'react-hyperscript-helpers';
import Modal from 'react-modal';
import { Notifications } from '../../libs/utils';
import BroadLibraryCardAgreementLink from '../../assets/Library_Card_Agreement_2021.pdf';
import NIHLibraryCardAgreementLink from '../../assets/NIH_Library_Card_Agreement_11_17_22_version.pdf';

import {Styles} from '../../libs/theme';
import { User } from '../../libs/ajax';
import Acknowledgments from '../../libs/acknowledgements';

const acceptDaas = async () => {
  return await User.acceptAcknowledgments(Acknowledgments.broadLcaAcknowledgement, Acknowledgments.nihLcaAcknowledgement);
};

export const SigningOfficialDAAModal = (props) => {

  const {
    open,
    setOpen,
    user,
  } = props;

  const acceptAndClose = () => {
    acceptDaas(user).then(() => {
      setOpen(false);
    }).catch(() => {
      Notifications.showError({text: 'Failed to accept DAA agreements.'});
      setOpen(false);
    });
  };

  return h(Modal, {
    isOpen: open,
    onRequestClose: acceptAndClose,
    style: {
      content: {
        ...Styles.MODAL.CONTENT,
        height: '325px',
      },
      overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
    },
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
        id: 'btn_save', onClick: acceptAndClose,
        className: 'button button-blue',
        style: {
          marginRight: '2rem',
        }
      }, ['I Agree']),
    ]),

  ]);
};

export default SigningOfficialDAAModal;