import React from 'react';
import { ListItemIcon } from '@mui/material';
import { Box, Typography, List, ListItem, ListItemButton, Checkbox, ListItemText } from '@mui/material';

const DataUseFilters = (props) => {
  const { datasets, dataUseFilters, filterHandler, searchRef } = props;
  const isFiltered = (filter) => dataUseFilters?.indexOf(filter) > -1;
  const accessFilters = ['GRU', 'HMB', 'DS',];
  return (
    <Box sx={{ bgcolor: 'background.paper' }}>
      <Typography variant="h6" gutterBottom component="div" sx={{ fontFamily: 'Montserrat', fontWeight: '600' }} marginTop="1em">
        Primary Use
      </Typography>
      <List sx={{ margin: '-0.5em -0.5em' }}>
        {
          accessFilters.map((filter) => {
            return (
              <ListItem disablePadding key={filter}>
                <ListItemButton sx={{ padding: '0' }} onClick={(event) => filterHandler(event, datasets, filter, searchRef.current.value)}>
                  <ListItemIcon>
                    <Checkbox checked={isFiltered(filter)} />
                  </ListItemIcon>
                  <ListItemText primary={filter} sx={{ fontFamily: 'Montserrat', transform: 'scale(1.2)' }} />
                </ListItemButton>
              </ListItem>
            );
          })
        }
      </List>
    </Box>
  );
};


export default DataUseFilters;