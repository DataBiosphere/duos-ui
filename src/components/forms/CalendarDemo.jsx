import React from 'react';
import {FormField} from './forms';
import {Styles} from '../../libs/theme';
import {FormFieldTypes, FormValidators} from './forms';
import dayjs from 'dayjs';

export const CalendarDemo = () => {
  return (<div style={Styles.PAGE}>
    <FormField
      type = {FormFieldTypes.CALENDAR}
      id = {'releaseDate'}
      title = {'Release Date'}
      defaultValue = {dayjs()}
      validators = {[FormValidators.DATEJS]}
    />
  </div>);
};