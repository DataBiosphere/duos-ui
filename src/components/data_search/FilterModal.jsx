/* eslint-disable indent */
import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  Box,
  Divider
} from '@mui/material';

const FilterModal = (props) => {
  const { open, toggleModal, filterHandler, searchRef, secondaryUseFilters } = props;
  const [state, setState] = React.useState({
    NMDS: false,
    NCTRL: false,
    NAGR: false,
    NCU: false,
    POA: false
  });

  const handleChange = (event) => {
    setState({
      ...state,
      [event.target.name]: event.target.checked,
    });
  };

  const handleClickOpen = () => {
    toggleModal();
  };

  const handleClose = () => {
    toggleModal();
  };

  const controlComponents = {
    NMDS: {
      label: 'Methods development/Validation study',
      chipLabel: 'METHODS'
    },
    NCTRL: {
      label: 'Control Set',
      chipLabel: 'CONTROL'
    },
    NAGR: {
      label: 'Aggregate analysis to understand variation in the general population',
      chipLabel: 'AGGREGATES'
    },
    POA: {
      label: 'Study population origins or ancestry',
      chipLabel: 'POA'
    },
    NCU: {
      label: 'Commercial purpose/by a commercial entity',
      chipLabel: 'COMMERCIAL'
    }
  };

  const renderFormControl = (name, label, chipLabel) => (
    <FormControlLabel
      key={label}
      control={<Checkbox checked={state[name]} onChange={handleChange} name={name} />}
      label={
        <>
          <span key={label} style={{ marginRight: '1rem' }}>{label}</span>
          <Chip style={{ padding: '0.15em' }} size='small' label={chipLabel} color='primary' />
        </>
      }
    />
  );

  return (
    <React.Fragment>
      <Box sx={{ bgcolor: 'background.paper' }} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            style={{
              fontFamily: 'Montserrat',
              fontSize: '1.15rem',
              padding: '0.25em'
            }}
            size='large'
            variant="link" onClick={handleClickOpen}>
            Filter by Research Purpose
          </Button>
          <Button
            size='small'
            style={{
              fontFamily: 'Montserrat',
              fontSize: '1rem',
              padding: '0.15em'
            }}
            variant='outlined'
            onClick={() => {
              filterHandler([], searchRef.current.value);
            }}
          >Clear</Button>
        </div>

        <div style={{ marginTop: '1rem' }}>
          {secondaryUseFilters.map((filter) => {
            const label = controlComponents[filter].chipLabel;
            return (
              <Chip style={{ fontSize: '1rem' }} key='filter' size='small' color='primary' label={label} />
            );
          })}
        </div>
        <Divider />
      </Box>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          component: 'form',
          onSubmit: (event) => {
            event.preventDefault();
            const selectedFilters = Object.keys(state).filter(key => state[key]);
            toggleModal();
            filterHandler(selectedFilters, searchRef.current.value);
          },
        }}
        sx={{
          'transform': 'scale(1.5)'
        }}
      >
        <DialogTitle>Filter By Research Purpose</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Describe your proposed research using the GA4GH Data Use Ontology terms below
          </DialogContentText>
          <FormControl
            required
            component="fieldset"
            sx={{ m: 3 }}
            variant="standard"
          >
            <FormGroup>
              {Object.entries(controlComponents).map(([name, { label, chipLabel }]) => (
                renderFormControl(name, label, chipLabel)
              ))}
            </FormGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button variant='contained' type="submit">Save All Filters</Button>
          <Button variant='outlined' onClick={toggleModal}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

export default FilterModal;
