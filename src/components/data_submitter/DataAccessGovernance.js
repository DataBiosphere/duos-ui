import ConsentGroup from './ConsentGroup';
import { cloneDeep } from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';

export const DataAccessGovernance = (props) => {
  const {
    formData, setFormData
  } = props;

  const updateFormData = (updatedFields) => {
    setFormData(
      ...formData,
      ...updatedFields,
    );
  };

  const addNewConsentGroup = () => {
    const consentGroups = cloneDeep(formData.consentGroups);
    consentGroups.push({});
    updateFormData({
      consentGroups: consentGroups,
    });

  };

  return div({}, [
    // controlled or open access

    div({}, [
      div({},
        [
          // formData.consentGroups.forEach((group, idx) =>
          h(ConsentGroup, {
            key: '0',
            saveConsentGroup: (newGroup) => {
              const consentGroups = cloneDeep(formData.consentGroups);
              consentGroups[0] = newGroup;

              updateFormData({
                consentGroups: consentGroups,
              });
            },
          })])
    ])
  ]);
};

export default DataAccessGovernance;