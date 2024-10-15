import * as React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { Typography } from '@mui/material';
import { Checkbox } from '@mui/material';
import { flatten, uniq, compact, capitalize } from 'lodash';

export const DatasetFilterList = (props) => {
  const { datasets, filters, filterHandler, isFiltered, searchRef } = props;

  const accessManagementFilters = uniq(compact(datasets.map((dataset) => dataset.accessManagement)));
  const dataUseFilters = uniq(compact(flatten(datasets.map((dataset) => dataset.dataUse?.primary))).map((dataUse) => dataUse.code));

  return (
    <Box sx={{ bgcolor: 'background.paper' }}>
      <Typography variant="h5" gutterBottom component="div" sx={{ fontFamily: 'Montserrat', fontWeight: '600' }}>
        Filters
      </Typography>
      <Divider />
      <Typography variant="h6" gutterBottom component="div" sx={{ fontFamily: 'Montserrat', fontWeight: '600' }} marginTop="1em">
        Access Type
      </Typography>
      <List sx={{ margin: '-0.5em -0.5em'}}>
        {
          accessManagementFilters.map((filter) => {
            const filterName = capitalize(filter);
            const category = 'accessManagement';
            return (
              <ListItem disablePadding key={filter}>
                <ListItemButton sx={{ padding: '0' }} onClick={(event) => filterHandler(event, datasets, category, filter, searchRef.current.value)}>
                  <ListItemIcon>
                    <Checkbox checked={isFiltered(filter, category)} />
                  </ListItemIcon>
                  <ListItemText primary={filterName} sx={{ fontFamily: 'Montserrat', transform: 'scale(1.2)' }} />
                </ListItemButton>
              </ListItem>
            );
          })
        }
      </List>
      <Typography variant="h6" gutterBottom component="div" sx={{ fontFamily: 'Montserrat', fontWeight: '600' }} marginTop="1em">
        Primary Data Use
      </Typography>
      <List sx={{ margin: '-0.5em -0.5em'}}>
        {
          dataUseFilters.map((filter) => {
            const filterName = filter.toUpperCase();
            const category = 'dataUse';
            return (
              <ListItem disablePadding key={filter}>
                <ListItemButton sx={{ padding: '0' }} onClick={(event) => filterHandler(event, datasets, category, filter, searchRef.current.value)}>
                  <ListItemIcon>
                    <Checkbox checked={isFiltered(filter, category)} />
                  </ListItemIcon>
                  <ListItemText primary={filterName} sx={{ fontFamily: 'Montserrat', transform: 'scale(1.2)' }} />
                </ListItemButton>
              </ListItem>
            );
          })
        }
      </List>
    </Box>
  );
};

export default DatasetFilterList;
