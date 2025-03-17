import React, {useCallback} from 'react';
import {FormField, FormFieldTypes, FormValidators} from './forms';
import {cloneDeep} from 'lodash/fp';
import {set} from 'lodash';
import {Link} from 'react-router-dom';
import {Styles} from '../../libs/theme';
import {asIdAndDisplayText, SelectEntry} from './SelectOptionInterface';
import {CloudProviders} from './CloudProviders';
import {DataLocations} from "./DataLocations";
import {ResearchStage} from "./ResearchStage";

export type DataLocationInfo = {
    cloudProvider: null | SelectEntry,
    dataLocation: null | SelectEntry,
    locationUrl: null | string,
    researchStage: null | SelectEntry,
};

export type DataLocationComponentProps = {
    idx: number,
    location: DataLocationInfo,
    onChange: ({idx, location}: { idx: number, location: DataLocationInfo }) => void,
    onDelete: (idx: number) => void,
};

export const DataLocation = (props: DataLocationComponentProps) => {
    const {idx, location, onChange, onDelete} = props;

    const onDataLocationChange = useCallback(({key, value}: { key: string, value: string | SelectEntry }) => {
        const newDataLocation = cloneDeep(location);
        set(newDataLocation, key, value)
        onChange({idx: idx, location: newDataLocation});
    }, [location, idx, onChange]);

    const deleteButton = <Link
        style={{marginLeft: '15px'}}
        id={`${idx}_deleteDataLocation`}
        className={'glyphicon glyphicon-trash'}
        onClick={() => onDelete(idx)}
        to={`#`}
    />

    return (<div style={Styles.REPEATING_SECTION}>
        <h4>Data Location {idx + 1} {deleteButton}</h4>
        <FormField
            style={{width: '50%', paddingBottom: '10px'}}
            id={'researchStage'}
            type={FormFieldTypes.SELECT}
            selectOptions={asIdAndDisplayText(ResearchStage.VALUES)}
            onChange={onDataLocationChange}
            placeholder={'Research stage (pre/post/intra-analysis)'}
            defaultValue={location.researchStage}/>
        <FormField
            style={{width: '50%', paddingBottom: '10px'}}
            id={'dataLocation'}
            type={FormFieldTypes.SELECT}
            selectOptions={asIdAndDisplayText(DataLocations.VALUES)}
            placeholder='Type or select location'
            isCreatable={true}
            defaultValue={location.dataLocation}
            onChange={onDataLocationChange}
        />
        <FormField
            style={{width: '50%', paddingBottom: '10px'}}
            id={'locationUrl'}
            name='locationUrl'
            validators={[FormValidators.URL]}
            placeholder='Enter a URL for your data location here'
            defaultValue={location.locationUrl}
            onChange={onDataLocationChange}
        />
        <FormField
            style={{width: '50%', paddingBottom: '10px'}}
            id={'cloudProvider'}
            type={FormFieldTypes.SELECT}
            selectOptions={asIdAndDisplayText(CloudProviders.VALUES)}
            placeholder='Select cloud provider'
            isCreatable={true}
            defaultValue={location.cloudProvider}
            onChange={onDataLocationChange}
        />
    </div>);
};
export default DataLocation;