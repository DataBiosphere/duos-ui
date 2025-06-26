import * as React from 'react';
import {ReactNode} from 'react';

export const getDataLocationLink = (dataLocation: string, dataUrl?: string): ReactNode => {
    let dataLocationLink: ReactNode;

    switch (dataLocation) {
        case 'TDR Location':
            dataLocationLink = <a href={dataUrl} target="_blank" rel="noopener noreferrer">Terra Data Repo</a>;
            break;
        case 'Terra Workspace':
            dataLocationLink = <a href={dataUrl} target="_blank" rel="noopener noreferrer">Terra Workspace</a>;
            break;
        case 'Not Determined':
            dataLocationLink = 'Not Determined';
            break;
        default:
            dataLocationLink = <a href={dataUrl} target="_blank" rel="noopener noreferrer">External to DUOS</a>;
    }

    return dataLocationLink;
}