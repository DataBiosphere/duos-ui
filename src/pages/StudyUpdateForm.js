import React from 'react';
import { useCallback, useState, useEffect } from 'react';
import { Notifications } from '../libs/utils';
import lockIcon from '../images/lock-icon.png';
import { Styles } from '../libs/theme';
import { cloneDeep, isNil } from 'lodash/fp';

import StudyInformationUpdate from '../components/study_update/EditStudyInfo';
import NihAnvilUseUpdate from '../components/study_update/EditNihAnvilUse';
import NihAdministrationInfoUpdate from '../components/study_update/EditNihAdminInfo';
import NihDataManagementUpdate from '../components/study_update/EditNihDataManagement';
import StudyConsentGroupsUpdate from '../components/study_update/EditStudyConsentGroups';
import { DataSet, User, Institution } from '../libs/ajax';
import { set } from 'lodash';


export const StudyUpdateForm = (props) => {
  //const { history } = props;
  const { studyId } = props.match.params;

  const [formData, setFormData] = useState({});
  const [study, setStudy] = useState({});
  const [user, setUser] = useState({});
  const [failedInit, setFailedInit] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [allConsentGroupsSaved, setAllConsentGroupsSaved] = useState(false);
  const [formFiles, setFormFiles] = useState({});


  useEffect(() => {
    const getAllInstitutions = async() => {
      const institutions = await Institution.list();
      setInstitutions(institutions);
    };

    const init = async () => {
      try {
        getAllInstitutions();
      } catch (error) {
        setFailedInit(true);
        Notifications.showError({
          text: 'Error: Unable to initialize data from server',
        });
      }
    };

    init();
  }, []);

  const onFileChange = useCallback(({ key, value }) => {
    setFormFiles((val) => {
      const newFiles = cloneDeep(val);
      set(newFiles, key, value);
      return newFiles;
    });
  }, [setFormFiles]);

  const onChange = useCallback(({ key, value }) => {
    setFormData((val) => {
      const newForm = cloneDeep(val);
      set(newForm, key, value);
      return newForm;
    });
  }, [setFormData]);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await User.getMe();
        setUser(me);
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
      <StudyInformationUpdate study={study} user={user}/>
      <NihAnvilUseUpdate study={study} onChange={onChange} formData={formData}/>
      <NihAdministrationInfoUpdate study={study} institutions={institutions}  onChange={onChange} formData={formData}/>
      <NihDataManagementUpdate study={study} onChange={onChange} onFileChange={onFileChange} formData={formData}/>
      { /* <StudyConsentGroupsUpdate study={study} onFileChange={onFileChange} setAllConsentGroupsSaved={setAllConsentGroupsSaved}/> */ }
    </form>
  </div>;
};

export default StudyUpdateForm;