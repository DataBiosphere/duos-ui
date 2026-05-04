import { getDarCollectionColumns } from 'src/utils/darCollectionColumns'
import { DarCollectionTableColumnOptions, consoleTypes } from 'src/utils/DarCollectionUtils'

describe('darCollectionColumns', () => {
  describe('getDarCollectionColumns', () => {
    describe('Console Type Handling', () => {
      it('returns admin columns with DAC on wide viewports', () => {
        const columns = getDarCollectionColumns(consoleTypes.ADMIN, 1600)

        expect(columns).to.include(DarCollectionTableColumnOptions.DAC)
        expect(columns).to.include(DarCollectionTableColumnOptions.DAR_CODE)
        expect(columns).to.include(DarCollectionTableColumnOptions.DATASET_COUNT)
        expect(columns).to.include(DarCollectionTableColumnOptions.EXPIRES_AT)
      })

      it('returns chair columns with DAC on wide viewports', () => {
        const columns = getDarCollectionColumns(consoleTypes.CHAIR, 1600)

        expect(columns).to.include(DarCollectionTableColumnOptions.DAC)
        expect(columns).to.include(DarCollectionTableColumnOptions.DAR_CODE)
      })

      it('returns member columns without DAC', () => {
        const columns = getDarCollectionColumns(consoleTypes.MEMBER, 1600)

        expect(columns).not.to.include(DarCollectionTableColumnOptions.DAC)
        expect(columns).to.include(DarCollectionTableColumnOptions.DAR_CODE)
      })

      it('returns researcher columns without DAC', () => {
        const columns = getDarCollectionColumns(consoleTypes.RESEARCHER, 1600)

        expect(columns).not.to.include(DarCollectionTableColumnOptions.DAC)
        expect(columns).to.include(DarCollectionTableColumnOptions.DAR_CODE)
      })

      it('returns signing official columns without DAC', () => {
        const columns = getDarCollectionColumns(consoleTypes.SIGNING_OFFICIAL, 1600)

        expect(columns).not.to.include(DarCollectionTableColumnOptions.DAC)
        expect(columns).to.include(DarCollectionTableColumnOptions.DAR_CODE)
      })

      it('defaults to admin breakpoints for unknown console type', () => {
        const columns = getDarCollectionColumns('unknownConsoleType', 1600)

        // Should have admin-level columns
        expect(columns).to.include(DarCollectionTableColumnOptions.DAR_CODE)
        expect(columns).to.include(DarCollectionTableColumnOptions.DATASET_COUNT)
      })
    })

    describe('Admin/Chair Breakpoints (1450px for DATASET_COUNT, 1250px for EXPIRES_AT)', () => {
      it('includes both DATASET_COUNT and EXPIRES_AT above breakpoints', () => {
        const columns = getDarCollectionColumns(consoleTypes.ADMIN, 1500)

        expect(columns).to.include(DarCollectionTableColumnOptions.DATASET_COUNT)
        expect(columns).to.include(DarCollectionTableColumnOptions.EXPIRES_AT)
      })

      it('removes DATASET_COUNT below 1450px breakpoint', () => {
        const columns = getDarCollectionColumns(consoleTypes.ADMIN, 1400)

        expect(columns).not.to.include(DarCollectionTableColumnOptions.DATASET_COUNT)
        expect(columns).to.include(DarCollectionTableColumnOptions.EXPIRES_AT)
      })

      it('removes EXPIRES_AT below 1250px breakpoint', () => {
        const columns = getDarCollectionColumns(consoleTypes.ADMIN, 1200)

        expect(columns).not.to.include(DarCollectionTableColumnOptions.DATASET_COUNT)
        expect(columns).not.to.include(DarCollectionTableColumnOptions.EXPIRES_AT)
      })

      it('keeps essential columns even at very narrow widths', () => {
        const columns = getDarCollectionColumns(consoleTypes.ADMIN, 600)

        expect(columns).to.include(DarCollectionTableColumnOptions.DAR_CODE)
        expect(columns).to.include(DarCollectionTableColumnOptions.NAME)
        expect(columns).to.include(DarCollectionTableColumnOptions.STATUS)
        expect(columns).to.include(DarCollectionTableColumnOptions.ACTIONS)
      })
    })

    describe('Researcher Breakpoints (1200px for DATASET_COUNT, 1000px for EXPIRES_AT)', () => {
      it('includes both DATASET_COUNT and EXPIRES_AT above breakpoints', () => {
        const columns = getDarCollectionColumns(consoleTypes.RESEARCHER, 1300)

        expect(columns).to.include(DarCollectionTableColumnOptions.DATASET_COUNT)
        expect(columns).to.include(DarCollectionTableColumnOptions.EXPIRES_AT)
      })

      it('removes DATASET_COUNT below 1200px breakpoint', () => {
        const columns = getDarCollectionColumns(consoleTypes.RESEARCHER, 1100)

        expect(columns).not.to.include(DarCollectionTableColumnOptions.DATASET_COUNT)
        expect(columns).to.include(DarCollectionTableColumnOptions.EXPIRES_AT)
      })

      it('removes EXPIRES_AT below 1000px breakpoint', () => {
        const columns = getDarCollectionColumns(consoleTypes.RESEARCHER, 900)

        expect(columns).not.to.include(DarCollectionTableColumnOptions.DATASET_COUNT)
        expect(columns).not.to.include(DarCollectionTableColumnOptions.EXPIRES_AT)
      })
    })

    describe('Edge Cases', () => {
      it('returns correct columns at exact breakpoint boundaries', () => {
        expect(getDarCollectionColumns(consoleTypes.ADMIN, 1450)).to.include(DarCollectionTableColumnOptions.DATASET_COUNT)
        expect(getDarCollectionColumns(consoleTypes.ADMIN, 1449)).not.to.include(DarCollectionTableColumnOptions.DATASET_COUNT)

        expect(getDarCollectionColumns(consoleTypes.ADMIN, 1250)).to.include(DarCollectionTableColumnOptions.EXPIRES_AT)
        expect(getDarCollectionColumns(consoleTypes.ADMIN, 1249)).not.to.include(DarCollectionTableColumnOptions.EXPIRES_AT)
      })

      it('handles zero width gracefully', () => {
        const columns = getDarCollectionColumns(consoleTypes.ADMIN, 0)

        expect(columns).to.be.an('array')
        expect(columns).to.include(DarCollectionTableColumnOptions.DAR_CODE)
      })

      it('handles very large width gracefully', () => {
        const columns = getDarCollectionColumns(consoleTypes.ADMIN, 9999)

        expect(columns).to.include(DarCollectionTableColumnOptions.DATASET_COUNT)
        expect(columns).to.include(DarCollectionTableColumnOptions.EXPIRES_AT)
      })
    })

    describe('Column Order', () => {
      it('preserves DAC position right after DAR_CODE for admin', () => {
        const columns = getDarCollectionColumns(consoleTypes.ADMIN, 1600)

        const darCodeIndex = columns.indexOf(DarCollectionTableColumnOptions.DAR_CODE)
        const dacIndex = columns.indexOf(DarCollectionTableColumnOptions.DAC)

        expect(dacIndex).to.equal(darCodeIndex + 1)
      })

      it('preserves default column order for non-admin consoles', () => {
        const columns = getDarCollectionColumns(consoleTypes.RESEARCHER, 1600)

        expect(columns[0]).to.equal(DarCollectionTableColumnOptions.DAR_CODE)
        expect(columns).to.include(DarCollectionTableColumnOptions.NAME)
      })
    })
  })
})
