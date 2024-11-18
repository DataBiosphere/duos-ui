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
import externalAccessIcon from '../../images/external_access.svg';
import openAccessIcon from '../../images/open_access.svg';
import controlledAccessIcon from '../../images/controlled_access.svg';

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

export const AccessManagementFilterItemList = (props) => {
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
                <ListItemText sx={{ fontFamily: 'Montserrat', transform: 'scale(1.2)' }}>
                  { filterName === 'Open' ? <div style={{display: 'flex', alignItems: 'center'}}>
                    <img src={openAccessIcon} style={{width: '10px', marginRight: 6}} /> {filterName} </div> :
                    filterName === 'Controlled' ? <div style={{display: 'flex', alignItems: 'center'}}>
                      <img src={controlledAccessIcon} style={{width: '10px', marginRight: 6}} /> {filterName} </div> :
                      filterName === 'External' ? <div style={{display: 'flex', alignItems: 'center'}}>
                        <img src={externalAccessIcon} style={{width: '10px', marginRight: 6}} /> {filterName} </div> :
                        filterName
                  }
                </ListItemText>
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
      <AccessManagementFilterItemList
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
    </Box>
  );
};

export default DatasetFilterList;
