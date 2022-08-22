import lockIcon from '../images/lock-icon.png';
import {Styles} from '../libs/theme';
import DataAccessGovernance from '../components/data_submission/DataAccessGovernance';
import DataSubmissionStudyInformation from '../components/data_submission/ds_study_information';
import {h, div, img, h1, form} from 'react-hyperscript-helpers';
import { set } from 'lodash/fp';


export const DataSubmissionForm = () => {
  let formData = {};

  const onChange = ({ key, value, isValid }) => {
    /* eslint-disable no-console */
    console.log('StudyInfo OnChange:', key, value, isValid);
    set(key, value, formData);
  };

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
      h(DataSubmissionStudyInformation, { onChange }),

      h(DataAccessGovernance, { onChange }),
    ])
  ]);
};

export default DataSubmissionForm;