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
    onChange: Function;
    onError: Function;
    readOnly: boolean;
}

export const DuosDatePicker = (props: DUOSDatePickerProps) => {
  const {inputFormat, value, onChange, onError, readOnly} = props;
  const theme = createTheme({
    palette: {
      primary:{
        main:'#216FB4',
      },
      secondary:{
        main:'#ffffff',
        contrastText:'#216FB4'
      },
    },
    components: {
      MuiButton:{
        styleOverrides:{
          text:{
            fontFamily: 'Montserrat',
            fontSize: '13px',
            fontWeight: '400',
            padding: '7px 20px 7px 20px',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          sizeMedium: {
            color:'#216FB4',
          },
        },
      },
      MuiDayCalendar:{
        styleOverrides:{
          weekDayLabel:{
            fontFamily: 'Montserrat',
            color: '#000',
            fontSize: '13px',
            fontWeight: '400',
            padding: '7px 20px 7px 20px',
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
            color: '#000',
            fontSize: '13px',
            fontWeight: '400',
            padding: '7px 20px 7px 20px',
            '&.Mui-selected': {
              backgroundColor: '#216FB4',
              '&:hover': {
                backgroundColor: '#216FB4',
              },
              '&:focus': {
                backgroundColor: '#216FB4',
              },
            },
          },
        },
      },
      MuiPickersYear: {
        styleOverrides: {
          yearButton: {
            fontFamily: 'Montserrat',
            color: '#000',
            fontSize: '13px',
            fontWeight: '400',
            padding: '7px 20px 7px 20px',
            '&.Mui-selected': {
              backgroundColor: '#216FB4',
              '&:hover': {
                backgroundColor: '#216FB4',
              },
              '&:focus': {
                backgroundColor: '#216FB4',
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
            color: '#000',
            fontSize: '13px',
            fontWeight: '400',
            padding: '7px 20px 7px 20px',
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
        onAccept={(value)=>{onChange(value);}}
        onError={(error, value)=> onError(error, value)}
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