import React from 'react';
import { useState, useEffect } from 'react';
import './SearchSelect.css';
import {FormField, FormFieldTypes} from './forms/forms';

export const SearchSelect = (props) => {
  const { onSelection, placeholder, options, value } = props;
  const [selectedInstitution, setSelectedInstitution] = useState();

  useEffect(() => {
    const selected = options.find(o => o.key === value);
    setSelectedInstitution(selected);
  }, [value, options]);

  return (
    <FormField
      id={'form_field_selection_id_' + value}
      type={FormFieldTypes.SELECT}
      selectOptions={(options).map((i) => {
        return {
          institutionId: i?.key,
          displayText: i?.displayText,
        };
      })}
      placeholder={placeholder}
      isCreatable={false}
      defaultValue={{
        institutionId: selectedInstitution?.institutionId,
        displayText: selectedInstitution?.displayText,
      }}
      onChange={onSelection}>
    </FormField>
  );
};
