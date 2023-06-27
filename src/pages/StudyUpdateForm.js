import React from 'react';
import { useState, useEffect } from 'react';

import { Notifications } from '../libs/utils';
import lockIcon from '../images/lock-icon.png';
import { Styles } from '../libs/theme';

import StudyUpdate from '../components/study_update/StudyUpdate';
import { DataSet } from '../libs/ajax';

export const StudyUpdateForm = (props) => {
  const { history } = props;
  const { studyId } = props.match.params;

  const [failedInit, setFailedInit] = useState(true);
  const [study, setStudy] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        setStudy(await DataSet.getStudyById(studyId));
        setFailedInit(false);
      } catch (error) {
        Notifications.showError({ text: 'Failed to load study' });
      }
    };
    init();
  }, [studyId]);

  return !failedInit && <div style={Styles.PAGE} >
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '112%', marginLeft: '-6%', padding: '0 2.5%' }}>
      <div className='left-header-section' style={Styles.LEFT_HEADER_SECTION} >
        <div style={Styles.ICON_CONTAINER}>
          <img id='lock-icon' src={lockIcon} style={Styles.HEADER_IMG} />
        </div>
        <div style={Styles.HEADER_CONTAINER}>
          <div style={Styles.TITLE}>
            Study Update Form
            <div style={Styles.MEDIUM_DESCRIPTION}>
              This is an easy way to update a study in DUOS!
            </div>
          </div>
        </div>
      </div>
    </div>

    <form style={{ margin: 'auto', maxWidth: 800 }}>
      <StudyUpdate study={study} history={history} />
    </form>
  </div>;
};

export default StudyUpdateForm;