
import { div, img } from 'react-hyperscript-helpers';
import loadingIndicator from '../images/loading-indicator.svg';

//spinner constant to be used everywhere
export const Spinner =
  div({ style: { textAlign: 'center', height: '44px', width: '180px' } }, [
    img({ src: loadingIndicator, alt: 'spinner' })
  ]);