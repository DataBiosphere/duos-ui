import * as React from 'react'
import { Button, Checkbox, TextField, Typography } from '@mui/material'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import { flatten, uniq, compact, orderBy } from 'lodash'
import { DatasetTerm, getAccessManagementSummary } from 'src/types/model'
import { FiltersTypes, generateDefaultParticipantCountValues } from 'src/components/data_search/DatasetFilterConstants'
import { muiCheckboxFix } from 'src/libs/muiThemeFix'

interface FilterItemHeaderProps {
  title: React.ReactNode
  headerStyle?: React.CSSProperties
}
export const FilterItemHeader = (props: FilterItemHeaderProps) => {
  const { title, headerStyle = { fontFamily: 'Montserrat', fontWeight: '600', marginTop: '1em' } } = props
  return (
    <Typography variant="h6" gutterBottom component="div" sx={headerStyle}>
      {title}
    </Typography>
  )
}

interface FilterItemListProps {
  category: string
  filter: string[]
  filterHandler: (category: string, filter: string | number) => void
  isFiltered: (filter: string, category: string) => boolean
  filterNameFn: (filter: string) => string
  filterDisplayFn?: (filter: string) => React.ReactNode
}
export const FilterItemList = (props: FilterItemListProps) => {
  const { category, filter, filterHandler, isFiltered, filterNameFn, filterDisplayFn } = props
  return (
    <List sx={{ margin: '-0.5em -0.5em' }}>
      {
        filter.map((filterOption) => {
          const filterName = filterNameFn(filterOption)
          return (
            <ListItem disablePadding key={filterOption}>
              <ListItemButton sx={{ padding: '0' }} onClick={() => filterHandler(category, filterOption)}>
                <ListItemIcon>
                  <Checkbox
                    checked={isFiltered(filterOption, category)}
                    sx={muiCheckboxFix}
                  />
                </ListItemIcon>
                <ListItemText sx={{ fontFamily: 'Montserrat', transform: 'scale(1.2)' }}>
                  {filterDisplayFn ? filterDisplayFn(filterOption) : filterName}
                </ListItemText>
              </ListItemButton>
            </ListItem>
          )
        })
      }
    </List>
  )
}

interface FilterItemRangeProps {
  allowableMin: number
  allowableMax: number
  min?: number
  max?: number
  minCategory: string
  maxCategory: string
  minInputProps?: React.InputHTMLAttributes<HTMLInputElement>
  maxInputProps?: React.InputHTMLAttributes<HTMLInputElement>
  filterHandler: (category: string, filter: string | number) => void
}

export const FilterItemRange = (props: FilterItemRangeProps) => {
  const { allowableMin, allowableMax, min, max, minCategory, maxCategory, minInputProps, maxInputProps, filterHandler } = props
  const baseInputProps = { max: allowableMax, min: allowableMin }
  const minInputPropsComplete = { ...baseInputProps, ...minInputProps }
  const maxInputPropsComplete = { ...baseInputProps, ...maxInputProps }

  // Use custom ID if provided in inputProps, otherwise use default pattern
  const minId = minInputProps?.id || (minCategory + '-range-input')
  const maxId = maxInputProps?.id || (maxCategory + '-range-input')

  return (
    <Box key={minCategory + '-' + maxCategory} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      <TextField
        type="number"
        value={min}
        id={minId}
        size="small"
        margin="dense"
        variant="outlined"
        helperText="minimum"
        FormHelperTextProps={{ style: { transform: 'scale(1.5)' } }}
        inputProps={minInputPropsComplete}
        onChange={event => filterHandler(minCategory, Number(event.target.value))}
      />
      <Box padding="0rem 1rem 1rem"> - </Box>
      <TextField
        type="number"
        value={max}
        id={maxId}
        size="small"
        margin="dense"
        variant="outlined"
        helperText="maximum"
        FormHelperTextProps={{ style: { transform: 'scale(1.5)' } }}
        inputProps={maxInputPropsComplete}
        onChange={event => filterHandler(maxCategory, Number(event.target.value))}
      />
    </Box>
  )
}

interface DatasetFilterListProps {
  datasets: DatasetTerm[]
  filterHandler: (category: string, filter: string | number) => void
  isFiltered: (filter: string, category: string) => boolean
  filters: FiltersTypes
  onClear: () => void
}
export const DatasetFilterList = (props: DatasetFilterListProps) => {
  const { datasets, filterHandler, filters, isFiltered, onClear } = props

  const accessManagementFilters = uniq(compact(datasets.map(dataset => dataset.accessManagement)))
  const dataUseFilters = uniq(compact(flatten(datasets.map(dataset => dataset.dataUse?.primary))).map(dataUse => dataUse.code))
  const dataTypeFilters = uniq(flatten(datasets.map(dataset => dataset.study.dataTypes)))
  const dacFilters = orderBy(uniq(compact(datasets.map(dataset => dataset.dac?.dacName))), dac => dac.toLowerCase(), 'asc')
  const defaultValues = generateDefaultParticipantCountValues(datasets)
  return (
    <Box sx={{ bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" gutterBottom component="div" sx={{ fontFamily: 'Montserrat', fontWeight: '600' }}>
          Filters
        </Typography>
        <Button onClick={onClear}>
          Clear Filters
        </Button>
      </Box>
      <Divider />
      <FilterItemHeader title="Access Type" />
      <FilterItemList
        category="accessManagement"
        filter={accessManagementFilters}
        filterHandler={filterHandler}
        isFiltered={isFiltered}
        filterNameFn={filter => getAccessManagementSummary(filter).name}
        filterDisplayFn={(filter) => {
          const accessManagementSummary = getAccessManagementSummary(filter)
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={accessManagementSummary.icon} alt={accessManagementSummary.name} style={{ width: '10px', marginRight: 6 }} />
              {accessManagementSummary.name}
            </div>
          )
        }}
      />
      <FilterItemHeader title="Data Use" />
      <FilterItemList
        category="dataUse"
        filter={dataUseFilters}
        filterHandler={filterHandler}
        isFiltered={isFiltered}
        filterNameFn={filter => filter.toUpperCase()}
      />
      <FilterItemHeader
        title={(
          <>
            <span style={{ fontWeight: '600' }}>Data Access Committee</span>
            {' '}
            <span>(DACs)</span>
          </>
        )}
        headerStyle={{ fontFamily: 'Montserrat', marginTop: '1em' }}
      />
      <FilterItemList
        category="dac"
        filter={dacFilters}
        filterHandler={filterHandler}
        isFiltered={isFiltered}
        filterNameFn={filter => filter}
      />
      <FilterItemHeader title="Data Type" />
      <FilterItemList
        category="dataType"
        filter={dataTypeFilters}
        filterHandler={filterHandler}
        isFiltered={isFiltered}
        filterNameFn={filter => filter}
      />
      <FilterItemHeader title="Participant Count" />
      <FilterItemRange
        allowableMin={defaultValues.min}
        allowableMax={defaultValues.max}
        min={filters.participantCountMin}
        max={filters.participantCountMax}
        minCategory="participantCountMin"
        maxCategory="participantCountMax"
        minInputProps={{ 'aria-label': 'Minimum participants' }}
        maxInputProps={{ 'aria-label': 'Maximum participants' }}
        filterHandler={filterHandler}
      />
    </Box>
  )
}

export default DatasetFilterList
