import {SelectOptionWithKeyNameAndAbbreviation} from './SelectOptionInterface';

export class DataLocations {
    static DBGAP: SelectOptionWithKeyNameAndAbbreviation = {key: 'DBGAP', name: 'dbGaP'};
    static TERRA: SelectOptionWithKeyNameAndAbbreviation = {key: 'TERRA', name: 'Terra'};
    static ONPREM: SelectOptionWithKeyNameAndAbbreviation = {key: 'ONPREM', name: 'On prem'};
    static VALUES: SelectOptionWithKeyNameAndAbbreviation[] = [
        DataLocations.DBGAP,
        DataLocations.TERRA,
        DataLocations.ONPREM
    ]

}