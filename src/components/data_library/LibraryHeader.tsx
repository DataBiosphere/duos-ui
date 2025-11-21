import React from 'react'
import { Box, TextField, Button, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { LibraryHeaderProps } from 'src/types/library'
import { useDebouncedValue } from 'src/hooks/useDebouncedValue'

export const LibraryHeader: React.FC<LibraryHeaderProps> = ({
  icon,
  title,
  description,
  searchTerm,
  onSearchChange,
  onClearSearch,
}) => {
  const [localSearchTerm, setLocalSearchTerm] = React.useState(searchTerm)
  const debouncedSearch = useDebouncedValue(localSearchTerm, 300)

  // Update parent when debounced value changes
  React.useEffect(() => {
    if (debouncedSearch !== searchTerm) {
      onSearchChange(debouncedSearch)
    }
  }, [debouncedSearch, searchTerm, onSearchChange])

  // Sync with external changes
  React.useEffect(() => {
    if (searchTerm !== localSearchTerm && searchTerm === '') {
      setLocalSearchTerm('')
    }
  }, [searchTerm, localSearchTerm])

  const handleClear = () => {
    setLocalSearchTerm('')
    onClearSearch()
  }

  return (
    <Box sx={{ paddingLeft: '2em', paddingRight: '2em', paddingTop: '2em' }}>
      {/* Title Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        {icon && (
          <Box component="img" src={icon} alt={title} sx={{ height: 50 }} />
        )}
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <TextField
          fullWidth
          placeholder="Enter search terms"
          value={localSearchTerm}
          onChange={e => setLocalSearchTerm(e.target.value)}
          data-cy="search-bar"
          aria-label="Search datasets"
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            },
          }}
          sx={{
            'backgroundColor': '#f3f6f7',
            '& .MuiOutlinedInput-root': {
              borderRadius: '5px',
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleClear}
          sx={{ minWidth: '10em', whiteSpace: 'nowrap' }}
        >
          Clear Search
        </Button>
      </Box>
    </Box>
  )
}

export default LibraryHeader
