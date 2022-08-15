import { useState } from 'react';
import {h, div, img, h1, form} from 'react-hyperscript-helpers';
import lockIcon from '../images/lock-icon.png';
import {Styles} from '../libs/theme';

import DataSubmissionStudyInformation from '../components/data_submission/ds_study_information';


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
            h1(['Register a Dataset']),
            div(
              { style: { fontSize: '1.6rem' }},
              ['Submit a new dataset to DUOS']
            ),
          ]),
        ]
      ),
    ]),

    form({}, [
      h(DataSubmissionStudyInformation, {
        onChange: ({ key, value }) => {
          /* eslint-disable no-console */
          console.log('StudyInfo OnChange:', key, value);
        }
      })
    ])
  ]);
};

export default DataSubmissionForm;