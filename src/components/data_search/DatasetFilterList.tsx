import * as React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { Button, TextField, Typography } from '@mui/material';
import { Checkbox } from '@mui/material';
import { flatten, uniq, compact, orderBy } from 'lodash';
import {DatasetTerm, getAccessManagementSummary} from '../../types/model';

interface FilterItemHeaderProps {
  title: React.ReactNode;
  headerStyle?: React.CSSProperties;
}
export const FilterItemHeader = (props: FilterItemHeaderProps) => {
  const { title, headerStyle = { fontFamily: 'Montserrat', fontWeight: '600', marginTop: '1em' } } = props;
  return (
    <Typography variant='h6' gutterBottom component='div' sx={headerStyle}>
      {title}
    </Typography>
  );
};

interface FilterItemListProps {
  category: string;
  datasets: DatasetTerm[]
  filter: string[];
  filterHandler: (category: string, filter: string) => void;
  isFiltered: (filter: string, category: string) => boolean;
  filterNameFn: (filter: string) => string;
  filterDisplayFn?: (filter: string) => React.ReactNode;
}
export const FilterItemList = (props: FilterItemListProps) => {
  const { category, filter, filterHandler, isFiltered, filterNameFn, filterDisplayFn } = props;
  return (
    <List sx={{ margin: '-0.5em -0.5em' }}>
      {
        filter.map((filterOption) => {
          const filterName = filterNameFn(filterOption);
          return (
            <ListItem disablePadding key={filterOption}>
              <ListItemButton sx={{ padding: '0' }} onClick={() => filterHandler(category, filterOption)}>
                <ListItemIcon>
                  <Checkbox checked={isFiltered(filterOption, category)} />
                </ListItemIcon>
                <ListItemText sx={{ fontFamily: 'Montserrat', transform: 'scale(1.2)' }}>
                  {filterDisplayFn ? filterDisplayFn(filterOption) : filterName}
                </ListItemText>
              </ListItemButton>
            </ListItem>
          );
        })
      }
    </List>
  );
};

interface FilterItemRangeProps {
  min: number;
  max: number;
  minCategory: string;
  maxCategory: string;
  datasets: DatasetTerm[];
  filterHandler: (category: string, filter: string) => void;
}

export const FilterItemRange = (props: FilterItemRangeProps) => {
  const { min, max, minCategory, maxCategory, filterHandler } = props;
  const getValue = (val: any, defaultVal: any) => isNaN(Number(val)) ? defaultVal : Number(val);
  return (
    <Box key={minCategory + '-' + maxCategory} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      <TextField id={minCategory + '-range-input'} size='small' margin='dense' variant='outlined' defaultValue={min}
        helperText={'minimum'}
        FormHelperTextProps={{style: { transform: 'scale(1.5)' }}}
        onChange={(event) => filterHandler(minCategory, getValue(event.target.value, min))}/>
      <Box padding={'0rem 1rem 1rem'}> - </Box>
      <TextField id={maxCategory + '-range-input'} size='small' margin='dense' variant='outlined' defaultValue={max}
        helperText={'maximum'}
        FormHelperTextProps={{style: {transform: 'scale(1.5)'}}}
        onChange={(event) => filterHandler(maxCategory, getValue(event.target.value, max))}
      />
    </Box>
  );
};

interface DatasetFilterListProps {
  datasets: DatasetTerm[];
  filterHandler: (category: string, filter: string) => void;
  isFiltered: (filter: string, category: string) => boolean;
  onClear: () => void;
}
export const DatasetFilterList = (props: DatasetFilterListProps) => {
  const { datasets, filterHandler, isFiltered, onClear } = props;

  const accessManagementFilters = uniq(compact(datasets.map((dataset) => dataset.accessManagement)));
  const dataUseFilters = uniq(compact(flatten(datasets.map((dataset) => dataset.dataUse?.primary))).map((dataUse) => dataUse.code));
  const dataTypeFilters = uniq(flatten(datasets.map((dataset) => dataset.study.dataTypes)));
  const dacFilters = orderBy(uniq(compact(datasets.map((dataset) => dataset.dac?.dacName))), (dac) => dac.toLowerCase(), 'asc');
  const defaultValues = datasets.reduce((acc, dataset) => {
    return {
      max: Math.max(acc.max, dataset.participantCount ? dataset.participantCount : 0),
      min: Math.min(acc.min, dataset.participantCount ? dataset.participantCount : Infinity) };
  }, {max: 0, min: Infinity});
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
        filterNameFn={(filter) => getAccessManagementSummary(filter).name}
        filterDisplayFn={(filter) => {
          const accessManagementSummary = getAccessManagementSummary(filter);
          return (
            <div style={{display: 'flex', alignItems: 'center'}}>
              <img src={accessManagementSummary.icon} alt={accessManagementSummary.name} style={{width: '10px', marginRight: 6}}/>
              {accessManagementSummary.name}
            </div>);}
        }/>
      <FilterItemHeader title='Data Use'/>
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
      <FilterItemHeader title='Data Type' />
      <FilterItemList
        category='dataType'
        datasets={datasets}
        filter={dataTypeFilters}
        filterHandler={filterHandler}
        isFiltered={isFiltered}
        filterNameFn={(filter) => filter}
      />
      <FilterItemHeader title='Participant Count' />
      <FilterItemRange
        min={defaultValues.min}
        max={defaultValues.max}
        minCategory='participantCountMin'
        maxCategory='participantCountMax'
        datasets={datasets}
        filterHandler={filterHandler}
      />
    </Box>
  );
};

export default DatasetFilterList;
