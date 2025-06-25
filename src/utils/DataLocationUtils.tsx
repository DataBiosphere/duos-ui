import {Link} from '@mui/material';
import * as React from 'react';
import {ReactNode} from 'react';

export const getDataLocationLink = (dataLocation: string, dataUrl?: string): ReactNode => {
    let dataLocationLink;
    if (dataLocation === 'TDR Location') {
        dataLocationLink = 'Terra Data Repo';
    } else if (dataLocation === 'Terra Workspace') {
        dataLocationLink = dataUrl ?
            <Link href={dataUrl}>Terra Workspace</Link> : 'Terra Data Repo';
    } else if (dataLocation === 'Not Determined') {
        dataLocationLink = 'Not Determined';
    } else {
        dataLocationLink = dataUrl ?
            <Link href={dataUrl}>External to DUOS</Link> : 'External Location';
    }
    return dataLocationLink;
}