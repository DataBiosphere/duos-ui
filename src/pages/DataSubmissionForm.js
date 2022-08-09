import { useState } from 'react';
import {div, img} from 'react-hyperscript-helpers';
import lockIcon from '../images/lock-icon.png';
import {Styles} from '../libs/theme';


export const DataSubmissionForm = () => {

  // NOTE: remove after adding components
  /* eslint-disable no-unused-vars */
  const [formData, setFormData] = useState({});

  return div({ style: Styles.PAGE }, [
    div({ style: { display: 'flex', justifyContent: 'space-between', width: '112%', marginLeft: '-6%', padding: '0 2.5%' } }, [
      div(
        { className: 'left-header-section', style: Styles.LEFT_HEADER_SECTION },
        [
          div({ style: Styles.ICON_CONTAINER }, [
            img({
              id: 'lock-icon',
              src: lockIcon,
              style: Styles.HEADER_IMG,
            }),
          ]),
          div({ style: Styles.HEADER_CONTAINER }, [
            div({ style: {
              fontFamily: 'Montserrat',
              fontWeight: 600,
              fontSize: '2.8rem'
            } }, [
              'Register a Dataset',
            ]),
            div(
              {
                style: {
                  fontFamily: 'Montserrat',
                  fontSize: '1.6rem'
                },
              },
              ['Submit a new dataset to DUOS']
            ),
          ]),
        ]
      ),
    ]),
  ]);
};

export default DataSubmissionForm;