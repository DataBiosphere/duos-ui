import { describe, it, expect } from 'vitest'
import { Theme, Styles } from 'src/libs/theme'

describe('Theme', () => {
  describe('palette', () => {
    it('has all required color keys', () => {
      expect(Theme.palette.primary).toBeDefined()
      expect(Theme.palette.secondary).toBeDefined()
      expect(Theme.palette.highlighted).toBeDefined()
      expect(Theme.palette.link).toBeDefined()
      expect(Theme.palette.error).toBeDefined()
      expect(Theme.palette.success).toBeDefined()
      expect(Theme.palette.disabled).toBeDefined()
      expect(Theme.palette.white).toBeDefined()
    })

    it('has background sub-palette', () => {
      expect(Theme.palette.background.secondary).toBeDefined()
      expect(Theme.palette.background.highlighted).toBeDefined()
    })

    it('has correct hex values', () => {
      expect(Theme.palette.primary).toBe('#1f3b50')
      expect(Theme.palette.secondary).toBe('#00609f')
      expect(Theme.palette.white).toBe('#ffffff')
      expect(Theme.palette.error).toBe('#DB3214')
      expect(Theme.palette.success).toBe('#00928A')
    })
  })

  describe('font', () => {
    it('has weight variants', () => {
      expect(Theme.font.weight.semibold).toBe('600')
      expect(Theme.font.weight.regular).toBe('400')
      expect(Theme.font.weight.medium).toBe('500')
    })

    it('has size variants', () => {
      expect(Theme.font.size.title).toBe('28px')
      expect(Theme.font.size.superheader).toBe('24px')
      expect(Theme.font.size.small).toBe('1.5rem')
    })

    it('has leading variants', () => {
      expect(Theme.font.leading.regular).toBe('22px')
      expect(Theme.font.leading.dense).toBe('18px')
      expect(Theme.font.leading.title).toBe('34px')
    })
  })

  describe('legacy', () => {
    it('has legacy style values', () => {
      expect(Theme.legacy.color).toBe('#777777')
      expect(Theme.legacy.fontSize).toBe('15px')
      expect(Theme.legacy.fontFamily).toContain('Roboto')
    })
  })

  describe('lightTable', () => {
    it('has required table style keys', () => {
      expect(Theme.lightTable.margin).toBeDefined()
      expect(Theme.lightTable.borderRadius).toBeDefined()
      expect(Theme.lightTable.padding).toBeDefined()
      expect(Theme.lightTable.boxShadow).toBeDefined()
      expect(Theme.lightTable.border).toBeDefined()
      expect(Theme.lightTable.background).toBe('#ffffff')
    })
  })

  describe('textTableBody', () => {
    it('has text overflow styles', () => {
      expect(Theme.textTableBody.whiteSpace).toBe('nowrap')
      expect(Theme.textTableBody.overflow).toBe('hidden')
      expect(Theme.textTableBody.textOverflow).toBe('ellipsis')
    })
  })
})

describe('Styles', () => {
  it('uses Montserrat as the font family in TITLE', () => {
    expect(Styles.TITLE.fontFamily).toBe('Montserrat')
  })

  it('inherits font values from Theme', () => {
    expect(Styles.TITLE.fontWeight).toBe(Theme.font.weight.semibold)
    expect(Styles.TITLE.fontSize).toBe(Theme.font.size.title)
  })

  describe('TABLE', () => {
    it('has CONTAINER styles', () => {
      expect(Styles.TABLE.CONTAINER.fontFamily).toBe('Montserrat')
      expect(Styles.TABLE.CONTAINER.color).toBe('#7B7B7B')
    })

    it('TABLE_TEXT_BUTTON uses Theme.palette.secondary as background', () => {
      expect(Styles.TABLE.TABLE_TEXT_BUTTON.backgroundColor).toBe(Theme.palette.secondary)
    })

    it('TABLE_TEXT_BUTTON_SUCCESS uses Theme.palette.success as background', () => {
      expect(Styles.TABLE.TABLE_TEXT_BUTTON_SUCCESS.backgroundColor).toBe(Theme.palette.success)
    })

    it('TABLE_TEXT_BUTTON_OUTLINED uses Theme.palette.secondary for border and text color', () => {
      expect(Styles.TABLE.TABLE_TEXT_BUTTON_OUTLINED.color).toBe(Theme.palette.secondary)
      expect(Styles.TABLE.TABLE_TEXT_BUTTON_OUTLINED.borderColor).toBe(Theme.palette.secondary)
      expect(Styles.TABLE.TABLE_TEXT_BUTTON_OUTLINED.backgroundColor).toBe(Theme.palette.white)
    })

    it('has HEADER_ROW with uppercase transform', () => {
      expect(Styles.TABLE.HEADER_ROW.textTransform).toBe('uppercase')
      expect(Styles.TABLE.HEADER_ROW.fontWeight).toBe(Theme.font.weight.semibold)
    })

    it('has FOOTER with Montserrat font', () => {
      expect(Styles.TABLE.FOOTER.fontFamily).toBe('Montserrat')
    })
  })

  describe('MODAL', () => {
    it('TITLE_HEADER inherits from Theme', () => {
      expect(Styles.MODAL.TITLE_HEADER.fontSize).toBe(Theme.font.size.title)
      expect(Styles.MODAL.TITLE_HEADER.fontWeight).toBe(Theme.font.weight.semibold)
    })

    it('DAR_LABEL uses semibold weight', () => {
      expect(Styles.MODAL.DAR_LABEL.fontWeight).toBe(Theme.font.weight.semibold)
    })
  })

  describe('MINOR_HEADER', () => {
    it('uses Theme.palette.background.secondary as background', () => {
      expect(Styles.MINOR_HEADER.backgroundColor).toBe(Theme.palette.background.secondary)
    })
  })
})
