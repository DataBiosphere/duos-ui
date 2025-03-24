import React, {useCallback} from 'react';
import {DataLocation, DataLocationInfo} from './DataLocation';
import {cloneDeep} from 'lodash';

export type DataLocationsProps = {
    locations: DataLocationInfo[],
    onChange: (p: { key: string; value: DataLocationInfo[] }) => void
}

export const DataLocationList = (props: DataLocationsProps) => {
    const {locations, onChange} = props;
    const onChangeLocation = useCallback(({idx, location}: { idx: number, location: DataLocationInfo }) => {
        locations[idx] = location;
        onChange({key: 'locations', value: cloneDeep(locations)});
    }, [locations, onChange]);

    const onAddLocation = useCallback(() => {
        const emptyLocation = {
            cloudProvider: null,
            locationUrl: null,
            researchStage: null,
            dataLocation: null
        } as DataLocationInfo;
        onChangeLocation({idx:locations.length, location:emptyLocation});
    }, [locations.length, onChangeLocation]);

    const onDeleteLocation = useCallback((idx: number) => {
        locations.splice(idx, 1);
        onChange({key: 'locations', value: cloneDeep(locations)});
    }, [locations, onChange]);

    return (<div>
        <h4>Data Location(s)</h4>
        {locations.map((dataLocation, index: number) => {
            return <DataLocation key={index} idx={index} location={dataLocation} onChange={onChangeLocation}
                                 onDelete={onDeleteLocation}/>;
        })}
        <button className={'button-complex-outlined-secondary'}
                onClick={onAddLocation}>{locations?.length > 0 ? 'Add another location' : 'Add location'}<span
            className={'button-icon button-icon-circle-plus-outline'} style={{marginLeft: '8px'}}/></button>
    </div>);
};

export default DataLocationList;
