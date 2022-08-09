import ConsentGroup from './ConsentGroup';


const DataAccessGovernance = (props) => {
    const {
        formData, setFormData
    } = props;

    const updateFormData = (updatedFields) => {
        setFormData(
            ...formData,
            ...updatedFields,
        );
    }

    const addNewConsentGroup = () => {
        const consentGroups = cloneDeep(formData.consentGroups);
        consentGroups.push({});
        updateFormData({
            consentGroups: consentGroups,
        })

    }

    return div({}, [
        // controlled or open access

        div({}, [
            div({},
                formData.consentGroups.forEach((group, idx) => {
                    h(ConsentGroup, {
                        key: idx,
                        saveConsentGroup: (newGroup) => {
                            const consentGroups = cloneDeep(formData.consentGroups);
                            consentGroups[idx] = newGroup;
    
                            updateFormData({
                                consentGroups: consentGroups,
                            });
                        },
                    }),
                }),
            ),
        ]),
    ]);
}