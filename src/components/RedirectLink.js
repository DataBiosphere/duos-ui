import {a} from 'react-hyperscript-helpers';
import { Navigation } from '../libs/utils';

export default function RedirectLink(props) {
  return (
    a({onClick: () => Navigation.console(props.user, props.history)}, ['Return to Console'])
  );
}