import React, { useEffect, useRef, useState } from 'react'
import { Styles } from 'src/libs/theme'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import { styled } from '@mui/material/styles'
import InputBase from '@mui/material/InputBase'
import IconButton from '@mui/material/IconButton'
import { useDebouncedValue } from 'src/hooks/useDebouncedValue'

interface SearchBarProps {
  readonly handleSearchChange: (value: string) => void
  readonly initialValue?: string
  readonly placeholder?: string
  readonly style?: React.CSSProperties
}

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}))

const SearchIconWrapper = styled('div')(({ theme }) => ({
  color: '#777777',
  padding: theme.spacing(0, 1),
  height: '100%',
  position: 'absolute',
  top: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
}))

const ClearIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 1),
  height: '100%',
  position: 'absolute',
  top: 0,
  right: theme.spacing(4),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2,
}))

const StyledInputBase = styled(InputBase, {
  shouldForwardProp: prop => prop !== 'showClear',
})<{ showClear: boolean }>(({ theme, showClear }) => ({
  'color': 'inherit',
  'width': '30ch',
  'border': '1px solid #cecece',
  'borderRadius': '5px',
  'height': '4rem',
  'fontFamily': 'Montserrat',
  'fontSize': '1.5rem',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: theme.spacing(2),
    paddingRight: showClear
      ? `calc(1em + ${theme.spacing(8)})`
      : `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('padding-right'),
    width: '100%',
  },
}))

export default function SearchBar(props: SearchBarProps) {
  const { handleSearchChange, initialValue = '', placeholder = 'Enter search terms', style } = props
  const [value, setValue] = useState(initialValue)
  const debouncedValue = useDebouncedValue(value, 300)

  // Always hold the latest handler without adding it as a dep —
  // the effect should only fire when the debounced value changes,
  // not on every parent re-render that produces a new function reference.
  const handleSearchChangeRef = useRef(handleSearchChange)
  useEffect(() => {
    handleSearchChangeRef.current = handleSearchChange
  })

  // Skip the initial mount; only call when the user actually changes the value.
  const isMounted = useRef(false)
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      return
    }
    handleSearchChangeRef.current(debouncedValue)
  }, [debouncedValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }

  const handleClear = () => {
    setValue('')
    handleSearchChange('')
  }

  return (
    <div className="right-header-section" style={{ ...Styles.RIGHT_HEADER_SECTION, ...style }}>
      <Search>
        {!!value && (
          <ClearIconWrapper>
            <IconButton
              size="small"
              onClick={handleClear}
              tabIndex={-1}
              data-cy="clear-search"
              aria-label="clear search"
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </ClearIconWrapper>
        )}
        <StyledInputBase
          showClear={!!value}
          placeholder={placeholder}
          inputProps={{ 'aria-label': 'search', 'data-cy': 'search-bar' }}
          value={value}
          onChange={handleChange}
        />
        <SearchIconWrapper>
          <SearchIcon data-cy="search-icon" />
        </SearchIconWrapper>
      </Search>
    </div>
  )
}
