import React, {useMemo} from 'react';
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
import dayjs, {Dayjs} from 'dayjs';
import type {} from '@mui/x-date-pickers/themeAugmentation';


interface DUOSDatePickerProps {
    inputFormat: string;
    defaultValue: Dayjs;
    onChange: any;
    onError: any;
    readOnly: boolean;
}

export const DuosDatePicker = (props: DUOSDatePickerProps) => {
  const {inputFormat, defaultValue, onChange, onError, readOnly} = props;
  const duosColorBlue='#216FB4';
  //Required to display the error on initialization with an invalid value when letting the date picker manage the value.
  //onError must be excluded as a dependency of the hook because of change detection looping.
  const checkInitialValue = useMemo(()=>{  if (defaultValue != null && defaultValue.toString() === 'Invalid Date') {
    onError('Invalid Date', defaultValue.toString());
  }
  return true;},
  // eslint-disable-next-line
  [defaultValue]);
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
      {checkInitialValue && <DesktopDatePicker
        closeOnSelect={false}
        label={'Select a date'}
        format={inputFormat}
        defaultValue={defaultValue?dayjs(defaultValue): null}
        onChange={(value)=>{onChange(value?value.format(inputFormat):null);}}
        onAccept={(value)=>{onChange(value?value.format(inputFormat):null);}}
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
      }
    </LocalizationProvider>
  </ThemeProvider>;
};
