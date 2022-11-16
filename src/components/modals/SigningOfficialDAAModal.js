import { h, h2, a, p, div, span } from "react-hyperscript-helpers";
import Modal from 'react-modal';
import { Notifications } from "../../libs/utils";
import LibraryCardAgreementLink from '../../assets/Library_Card_Agreement_2021.pdf';
import { useEffect } from "react";
import {Styles, Theme} from '../../libs/theme';
import SimpleButton from '../SimpleButton';

const acceptDaas = async (user) => {
  return;
}

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
      Notifications.showError({text: "Failed to accept DAA agreements."});
      setOpen(false);
    });
  }

  useEffect(() => {
    console.log(open);
  }, [open])

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
          a({ target: '_blank', href: LibraryCardAgreementLink, className: 'button button-white', }, [
            span({className: 'glyphicon glyphicon-download'}),
            ' Broad Library Card Agreement'
          ])
        ]),
        div({}, [
          a({ target: '_blank', href: '', className: 'button button-white' }, [
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