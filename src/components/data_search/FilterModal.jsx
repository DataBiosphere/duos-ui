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
  Divider,
  Autocomplete,
  TextField
} from '@mui/material';
import { DAR } from '../../libs/ajax/DAR';

const getInitialState = () => {
  return {
    NMDS: false,
    NCTRL: false,
    NAGR: false,
    NCU: false,
    POA: false
  };
};

const FilterModal = (props) => {
  const { open, toggleModal, filterHandler, searchRef, dataUseFilters, filterDataUseHandler } = props;
  const [state, setState] = React.useState(getInitialState);
  const [options, setOptions] = React.useState([]);

  const formatOntologyForSelect = (ontology) => {
    return {
      id: ontology.id,
      label: ontology.label,
      item: ontology,
    };
  };

  const autocompleteOntologies = (query) => {
    return DAR.getAutoCompleteOT(query).then(
      items => {
        const options = items.map(formatOntologyForSelect);
        return options;
      });
  };

  const handleChange = (event) => {
    setState({
      ...state,
      [event.target.name]: event.target.checked,
    });
  };

  const handleClickOpen = (e) => {
    e.preventDefault();
    toggleModal();
  };

  const handleClose = () => {
    toggleModal();
  };

  const controlComponents = {
    GRU: {
      label: 'Is the primary purpose of this research to investigate a specific disease(s)?',
      chipLabel: 'GRU'
    },
    HMB: {
      label: 'Is the primary purpose health/medical/biomedical research in nature?',
      chipLabel: 'HMB'
    },
    POA: {
      label: 'Is the primary purpose of this research regarding population origins or ancestry?',
      chipLabel: 'NPOA'
    },
    NMDS: {
      label: 'Is the primary purpose of this research to develop or validate new methods for analyzing/intepreting data?',
      chipLabel: 'COMMERCIAL'
    }
  };

  const renderFormControl = (name, label, chipLabel) => (
    <React.Fragment key={label}>
      <FormControlLabel
        control={<Checkbox checked={state[name]} onChange={handleChange} name={name} />}
        label={
          <>
            <span style={{ marginRight: '1rem' }}>{label}</span>
            <Chip style={{ padding: '0.15em' }} size='small' label={chipLabel} color='primary' />
          </>
        }
      />

      {
        state.GRU === true && name === 'GRU' && <Autocomplete
          key={chipLabel}
          id="ontologies"
          multiple
          disableClearable
          options={options}
          onInputChange={(event, newInputValue) => {
            if (newInputValue) {
              autocompleteOntologies(newInputValue).then((newOptions) => {
                setOptions(newOptions);
              });
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Please enter one or more diseases"
            />
          )}
        />
      }
    </React.Fragment>
  );

  return (
    <React.Fragment>
      <Box sx={{ bgcolor: 'background.paper' }} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems:'baseline', marginBottom:'0.5rem', justifyContent:'space-between' }}>
          <a href=''
            style={{
              textDecoration: 'none',
              fontFamily: 'Montserrat',
              fontSize: '1.25rem',
              fontWeight:'600'
            }}
            onClick={handleClickOpen}
          >
           Filter Data approved for my research
          </a>
        </div>

        <div>
          {dataUseFilters.map((filter) => {
            const label = controlComponents[filter].chipLabel;
            return (
              <Chip
                onDelete={()=>filterDataUseHandler(filter)}
                style={{ fontSize: '1rem', margin: '0.1rem' }} key={filter} size='small' color='primary' label={label} />
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
        <DialogTitle>Filter data approved for my research</DialogTitle>
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