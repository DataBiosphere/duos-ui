import React from 'react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {
  DesktopDatePicker,
  LocalizationProvider,
  PickersActionBarProps,
  PickersDay,
  PickersDayProps
} from '@mui/x-date-pickers';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import {Button} from '@mui/material';
import DialogActions from '@mui/material/DialogActions';
import {Dayjs} from 'dayjs';
import type {} from '@mui/x-date-pickers/themeAugmentation';


interface DUOSDatePickerProps {
    inputFormat: string;
    value: Dayjs;
    onChange: any;
    onError: any;
    readOnly: boolean;
}

export const DuosDatePicker = (props: DUOSDatePickerProps) => {
  const {inputFormat, value, onChange, onError, readOnly} = props;
  const duosColorBlue='#216FB4';

  const theme = createTheme({
    palette: {
      primary:{
        main:duosColorBlue,
      },
      secondary:{
        main:'#ffffff',
        contrastText:duosColorBlue
      },
    },
    components: {
      MuiButton:{
        styleOverrides:{
          text:{
            fontFamily: 'Montserrat',
            fontSize: '13px',
            fontWeight: '400',
            padding: '7px 20px',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          sizeMedium: {
            color: duosColorBlue,
          },
        },
      },
      MuiDayCalendar:{
        styleOverrides:{
          weekDayLabel:{
            fontFamily: 'Montserrat',
            color: 'black',
            fontSize: '13px',
            fontWeight: '400',
            padding: '7px 20px',
            '&:first-of-type': {
              color: 'red',
            },
            '&:last-of-type': {
              color: 'red',
            },
          },
        },
      },
      MuiPickersArrowSwitcher:{
        styleOverrides:{
          button:{
            fontSize:'2.5rem',
          },
        },
      },
      MuiPickersDay: {
        styleOverrides: {
          root: {
            '--weekend': 'red',
            borderRadius: '8px',
            fontFamily: 'Montserrat',
            color: 'black',
            fontSize: '13px',
            fontWeight: '400',
            padding: '7px 20px',
            '&.Mui-selected': {
              backgroundColor: duosColorBlue,
              '&:hover': {
                backgroundColor: duosColorBlue,
              },
              '&:focus': {
                backgroundColor: duosColorBlue,
              },
            },
          },
        },
      },
      MuiPickersYear: {
        styleOverrides: {
          yearButton: {
            fontFamily: 'Montserrat',
            color: 'black',
            fontSize: '13px',
            fontWeight: '400',
            padding: '7px 20px',
            '&.Mui-selected': {
              backgroundColor: duosColorBlue,
              '&:hover': {
                backgroundColor: duosColorBlue,
              },
              '&:focus': {
                backgroundColor: duosColorBlue,
              },
            },
          },
        },
      },
      MuiPickersCalendarHeader: {
        styleOverrides: {
          root: {
            fontSize:'2.5rem',
          },
          switchViewIcon:{
            fontSize:'2.5rem',
          },
          label:{
            fontFamily: 'Montserrat',
            color: 'black',
            fontSize: '13px',
            fontWeight: '400',
            padding: '7px 20px',
          },
        }
      },
    },
  });

  const CancelSelectActionBar = (props:PickersActionBarProps) => {
    // Quirk of this control's usage pattern is the need to destructure the unused onSetToday and onClear from 'other'
    // props.  This is in part because per mockup, this control does not support 'clear' or 'go to today' style buttons.
    // eslint-disable-next-line no-unused-vars
    const {onAccept, onCancel, onSetToday, onClear, actions, ...other} = props;
    const buttons = actions?.map((actionType: React.Key | null | undefined) => {
      switch (actionType) {
        case 'cancel':
          return (
            <Button color={'secondary'} variant={'contained'} onClick={onCancel} key={actionType}>
                            Cancel
            </Button>
          );

        case 'accept':
          return (
            <Button color={'primary'} variant={'contained'} onClick={onAccept} key={actionType}>
                            Select
            </Button>
          );

        default:
          return null;
      }
    });
    return <DialogActions {...other}>{buttons}</DialogActions>;
  };

  const WeekendFormattedDay = (props: PickersDayProps<Dayjs>) => {
    const isWeekendDay = props.day.day() === 0 || props.day.day() === 6;
    const weekendStyle = isWeekendDay
      ? {color: 'var(--weekend)',}
      : {};
    return <PickersDay {...props} sx={{...weekendStyle}} />;
  };

  return <ThemeProvider theme={theme}>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DesktopDatePicker
        closeOnSelect={false}
        label={'Select a date'}
        format={inputFormat}
        value={value}
        onAccept={onChange}
        onError={onError}
        dayOfWeekFormatter={(day) => (`${day.format('ddd')}`)}
        readOnly={readOnly}
        slotProps={{
          actionBar: {
            actions: ['cancel', 'accept']
          },
        }}
        slots={{day: WeekendFormattedDay, actionBar: CancelSelectActionBar}}
      />
    </LocalizationProvider>
  </ThemeProvider>;
};