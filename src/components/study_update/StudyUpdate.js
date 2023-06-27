import { useCallback, useState, useEffect } from 'react';
import { button, h, h2, div } from 'react-hyperscript-helpers';
import { find, isArray, isNil, isEmpty } from 'lodash/fp';

import { Notifications } from '../../libs/utils';
import { User, DataSet } from '../../libs/ajax';
import { FormFieldTypes, FormField, FormValidators } from '../forms/forms';
import initialFormData from './NIHDataManagement';

import './ds_common.css';

export const StudyUpdate = (props) => {
    const { study, history } = props;

    const [formData, setFormData] = useState();

    const multiPartFormData = new FormData();
    multiPartFormData.append('dataset', JSON.stringify(newDataset));
    multiPartFormData.append('consentGroups', consentGroups);


}
