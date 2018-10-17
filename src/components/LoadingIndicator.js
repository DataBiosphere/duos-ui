import { Component } from 'react';
import { hh } from 'react-hyperscript-helpers';
import Modal from 'react-modal';

// const customStyles = {
//   overlay: {
//     position: 'fixed',
//     top: '0',
//     left: '0',
//     right: '0',
//     bottom: '0',
//     backgroundColor: 'rgba(0, 0, 0, 0.1)',
//   },

//   content: {
//     position: 'relative',
//     top: '0',
//     right: '0',
//     bottom: '0',
//     left: '0',
//     width: '100px',
//     margin: '45vh auto 20px auto',
//     background: 'transparent',
//     border: '0',
//   }
// };

Modal.setAppElement('#root');

export const LoadingIndicator = hh(class LoadingIndicator extends Component {

  render() {
    return null;
  }
});
