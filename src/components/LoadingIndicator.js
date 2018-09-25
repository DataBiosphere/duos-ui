import { Component } from 'react';
import { h, img, hh } from 'react-hyperscript-helpers';
import Modal from 'react-modal';

const customStyles = {
  overlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },

  content: {
    position: 'relative',
    top: '-10px',
    right: '0',
    bottom: '0',
    left: '-10px',
    background: 'transparent',
    border: '0',
  }
};

Modal.setAppElement('#root');

export const LoadingIndicator = hh(class LoadingIndicator extends Component {

  render() {

    return (

      h(Modal, {
        isOpen: true,
        style: customStyles,
        contentLabel: "Modal"
      }, [
          img({ src: "/images/loading-indicator.svg", alt: "Loading..." })
        ])
    );
  }
});
