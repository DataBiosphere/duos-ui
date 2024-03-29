import React from 'react';
import SimpleButton from '../SimpleButton';
import {includes} from 'lodash/fp';
import {Theme} from '../../libs/theme';
import {darCollectionUtils} from '../../libs/utils';

const { determineCollectionStatus, nonCancellableCollectionStatuses } = darCollectionUtils;

export default function CancelCollectionButton(props) {
  const { collection } = props;

  return (
    <SimpleButton
      key={`cancel-collection-${collection.id}`}
      label="Cancel"
      disabled={includes(determineCollectionStatus(collection))(nonCancellableCollectionStatuses)}
      baseColor={Theme.palette.secondary}
      additionalStyle={{
        padding: '5px 10px',
        fontSize: '1.45rem',
      }}
      onClick={() => props.showConfirmationModal(collection)}
    />
  );
}
