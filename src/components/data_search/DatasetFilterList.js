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

export const DatasetFilterList = (props) => {
  const { datasets, filters, filterHandler } = props;

  const isFiltered = (filter) => filters.indexOf(filter) > -1;

  return (
    <Box sx={{ bgcolor: 'background.paper' }}>
      <Typography variant="h5" gutterBottom component="div">
        Filters
      </Typography>
      <Divider />
      <Typography variant="h6" gutterBottom component="div" marginTop="1em">
        Access Type
      </Typography>
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={(event) => filterHandler(event, datasets, "open")}>
            <ListItemIcon>
              <Checkbox checked={isFiltered("open")} />
            </ListItemIcon>
            <ListItemText primary="Open" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={(event) => filterHandler(event, datasets, "controlled")}>
            <ListItemIcon>
              <Checkbox checked={isFiltered("controlled")} />
            </ListItemIcon>
            <ListItemText primary="Controlled" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
};

export default DatasetFilterList;
