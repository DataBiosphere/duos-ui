import React from 'react';
import {nihAccountLabel} from 'src/utils/ERACommonsUtils';
import './ERACommons.css'
export type ERACommonsDisplayProps = {
    eraCommonsId: string | undefined,
}

export const ERACommonsDisplay = (props: ERACommonsDisplayProps) => {
    const { eraCommonsId } = props;

    return(<div>
        <label className={'era-control-label'}>
            <span data-cy="era-commons-header">NIH {nihAccountLabel()} ID</span>
        </label>
        <div>
            <span data-cy="era-commons-display-id-value">{eraCommonsId ?? '(not recorded at time of submission)'}</span>
        </div>
    </div>)
}