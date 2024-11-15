import * as React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { Button, Typography } from '@mui/material';
import { Checkbox } from '@mui/material';
import { flatten, uniq, compact, capitalize, orderBy } from 'lodash';

export const FilterItemHeader = (props) => {
  const { title, headerStyle = { fontFamily: 'Montserrat', fontWeight: '600', marginTop: '1em' } } = props;
  return (
    <Typography variant='h6' gutterBottom component='div' sx={headerStyle}>
      {title}
    </Typography>
  );
};

export const FilterItemList = (props) => {
  const { category, datasets, filter, filterHandler, isFiltered, filterNameFn } = props;
  return (
    <List sx={{ margin: '-0.5em -0.5em' }}>
      {
        filter.map((filter) => {
          const filterName = filterNameFn(filter);
          return (
            <ListItem disablePadding key={filter}>
              <ListItemButton sx={{ padding: '0' }} onClick={(event) => filterHandler(event, datasets, category, filter)}>
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
  );
};

export const DatasetFilterList = (props) => {
  const { datasets, filters, filterHandler, isFiltered, onClear } = props;

  const accessManagementFilters = uniq(compact(datasets.map((dataset) => dataset.accessManagement)));
  const dataUseFilters = uniq(compact(flatten(datasets.map((dataset) => dataset.dataUse?.primary))).map((dataUse) => dataUse.code));
  const dataTypeFilters = uniq(flatten(datasets.map((dataset) => dataset.study.dataTypes)));
  const dacFilters = orderBy(uniq(compact(datasets.map((dataset) => dataset.dac?.dacName))), (dac) => dac.toLowerCase(), 'asc');

  return (
    <Box sx={{ bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='h5' gutterBottom component='div' sx={{ fontFamily: 'Montserrat', fontWeight: '600' }}>
          Filters
        </Typography>
        <Button onClick={onClear}>
          Clear Filters
        </Button>
      </Box>
      <Divider />
      <FilterItemHeader title='Access Type' />
      <FilterItemList
        category='accessManagement'
        datasets={datasets}
        filter={accessManagementFilters}
        filterHandler={filterHandler}
        isFiltered={isFiltered}
        filterNameFn={capitalize} />
      <FilterItemHeader title='Data Use' />
      <FilterItemList
        category='dataUse'
        datasets={datasets}
        filter={dataUseFilters}
        filterHandler={filterHandler}
        isFiltered={isFiltered}
        filterNameFn={(filter) => filter.toUpperCase()}
      />
      <FilterItemHeader
        title={<><span style={{ fontWeight: '600' }}>Data Access Committee</span> <span>(DACs)</span></>}
        headerStyle={{ fontFamily: 'Montserrat', marginTop: '1em' }}
      />
      <FilterItemList
        category='dac'
        datasets={datasets}
        filter={dacFilters}
        filterHandler={filterHandler}
        isFiltered={isFiltered}
        filterNameFn={(filter) => filter}
      />
      <FilterItemHeader title="Data Type" />
      <FilterItemList
        category="dataType"
        datasets={datasets}
        filter={dataTypeFilters}
        filterHandler={filterHandler}
        isFiltered={isFiltered}
        filterNameFn={(filter) => filter}
      />
    </Box>
  );
};

export default DatasetFilterList;
