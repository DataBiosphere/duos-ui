import React, {useState} from 'react';
import {User} from '../../libs/ajax';
import {DAC} from '../../libs/ajax';
import { div, h, img, a } from 'react-hyperscript-helpers';
import { DarCollectionTableColumnOptions, DarCollectionTable } from '../../components/dar_collection_table/DarCollectionTable';

export default function ControlledAccessGrants(props) {

    const [profile, setProfile] = useState({
        id: undefined
    });

    const [dataset, setDataset] = useState(props.dataset);
    const [approvedDatasets, setApprovedDatasets] = useState(props.approvedDatasets);

    const getUserProfile = async () => {
        const user = await User.getMe();
        setProfile({
            id: user.userId
        });
    };

    const retrieveApprovedDatasets = async () => {
        const updatedDataset = await DAR.getCollectionSummariesByRoleName(profile.id);
        setApprovedDatasets(updatedDataset);
    };    
    // display the grants as a table
    return div({ style: Styles.PAGE }, []);

}