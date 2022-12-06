import {div, h} from 'react-hyperscript-helpers';
import { Notification } from '../../components/Notification';

export const DarValidationMessages = (props) => {

  const {
    validationMessages,
    showValidationMessages,
    datacy='dar-validation-errors',
  } = props;

  return div({
    isRendered: showValidationMessages,
    datacy: datacy,
    style: {
      paddingTop: '10px',
    }
  },
  validationMessages?.map((err, idx) => {
    return div({style: {marginBottom: '10px'}}, [
      h(Notification,
        {
          key: idx,
          notificationData: {
            level: 'danger',
            message: err,
          }
        }),
    ]);
  }),
  );
};

export default DarValidationMessages;