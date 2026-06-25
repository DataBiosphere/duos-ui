import { describe, it, expect } from 'vitest'
import { theme } from 'src/components/sortable_table/Themes'

describe('sortable_table theme', () => {
  it('is defined', () => {
    expect(theme).toBeDefined()
  })

  describe('MuiTableSortLabel', () => {
    const root = theme.components?.MuiTableSortLabel?.styleOverrides?.root as Record<string, unknown>

    it('has root style overrides', () => {
      expect(root).toBeDefined()
    })

    it('sets text alignment to center', () => {
      expect(root?.textAlign).toBe('center')
    })

    it('sets color to #626262', () => {
      expect(root?.color).toBe('#626262')
    })

    it('keeps active color consistent with default', () => {
      const active = root?.['&.Mui-active'] as Record<string, unknown>
      expect(active?.color).toBe('#626262')
    })
  })

  describe('MuiTablePagination', () => {
    const overrides = theme.components?.MuiTablePagination?.styleOverrides

    it('has root style overrides', () => {
      expect(overrides?.root).toBeDefined()
    })

    it('root uses Montserrat font', () => {
      expect((overrides?.root as Record<string, unknown>)?.fontFamily).toBe('Montserrat')
    })

    it('root sets font size to 14px', () => {
      expect((overrides?.root as Record<string, unknown>)?.fontSize).toBe('14px')
    })

    it('actions has correct margins', () => {
      expect((overrides?.actions as Record<string, unknown>)?.marginRight).toBe('20px')
      expect((overrides?.actions as Record<string, unknown>)?.marginLeft).toBe('25px')
    })

    it('displayedRows uses Montserrat and smaller font size', () => {
      const displayedRows = overrides?.displayedRows as Record<string, unknown>
      expect(displayedRows?.fontFamily).toBe('Montserrat')
      expect(displayedRows?.fontSize).toBe('12px')
      expect(displayedRows?.color).toBe('#626262')
    })
  })

  describe('MuiTableCell', () => {
    const root = theme.components?.MuiTableCell?.styleOverrides?.root as Record<string, unknown>

    it('has root style overrides', () => {
      expect(root).toBeDefined()
    })

    it('uses Montserrat font', () => {
      expect(root?.fontFamily).toBe('Montserrat')
    })

    it('sets font size to 14px', () => {
      expect(root?.fontSize).toBe('14px')
    })

    it('sets font weight to 400', () => {
      expect(root?.fontWeight).toBe('400')
    })

    it('has consistent padding with MuiTablePagination root', () => {
      const paginationRoot = theme.components?.MuiTablePagination?.styleOverrides?.root as Record<string, unknown>
      expect(root?.padding).toBe(paginationRoot?.padding)
    })
  })
})
