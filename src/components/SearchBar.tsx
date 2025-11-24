import React, { useRef, useState } from 'react'
import { Styles } from 'src/libs/theme'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import { styled } from '@mui/material/styles'
import InputBase from '@mui/material/InputBase'
import IconButton from '@mui/material/IconButton'

interface SearchBarProps {
  readonly handleSearchChange: (value: string) => void
  readonly placeholder?: string
  readonly style?: React.CSSProperties
  readonly searchRef?: React.RefObject<HTMLInputElement>
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
  padding: theme.spacing(0, 2),
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
  'backgroundColor': '#f3f6f7',
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
  const { handleSearchChange, placeholder = 'Enter search terms', style, searchRef } = props
  const searchTerms = useRef<HTMLInputElement>(null)
  const inputRef = searchRef || searchTerms
  const [showClear, setShowClear] = useState(false)

  const emitValue = () => {
    handleSearchChange(inputRef.current?.value || '')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (inputRef.current) {
      inputRef.current.value = e.target.value
      setShowClear(!!inputRef.current.value)
      emitValue()
    }
  }

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
      setShowClear(false)
      emitValue()
    }
  }

  return (
    <div className="right-header-section" style={{ ...Styles.RIGHT_HEADER_SECTION, ...style }}>
      <Search>
        {showClear && (
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
          showClear={showClear}
          placeholder={placeholder}
          inputProps={{ 'aria-label': 'search', 'data-cy': 'search-bar' }}
          onChange={handleChange}
          inputRef={inputRef}
        />
        <SearchIconWrapper>
          <SearchIcon data-cy="search-icon" />
        </SearchIconWrapper>
      </Search>
    </div>
  )
}
