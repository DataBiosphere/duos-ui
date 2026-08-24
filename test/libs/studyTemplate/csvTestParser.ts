/**
 * A minimal RFC 4180 reader for the study-template specs. Deliberately not shipped in `src`: the UI
 * never parses templates (that is Consent's job), but the specs need to read the generated file and
 * the canonical fixtures back as records rather than assert on raw strings.
 *
 * Splits on physical lines, which is safe here because no v1 fixture puts a newline inside a quoted
 * cell. It does handle quoted commas and doubled quotes, which the fixtures do use.
 */

export interface TemplateRow {
  templateVersion: string
  recordType: string
  recordId: string
  parentRecordId: string
  field: string
  value: string
}

export const splitCsvLine = (line: string): string[] => {
  const cells: string[] = []
  let cell = ''
  let inQuotes = false
  let index = 0
  while (index < line.length) {
    const char = line[index]
    if (inQuotes) {
      if (char !== '"') {
        cell += char
      }
      else if (line[index + 1] === '"') {
        cell += '"'
        index++
      }
      else {
        inQuotes = false
      }
    }
    else if (char === '"') {
      inQuotes = true
    }
    else if (char === ',') {
      cells.push(cell)
      cell = ''
    }
    else {
      cell += char
    }
    index++
  }
  cells.push(cell)
  return cells
}

export const parseTemplateCsv = (csv: string): { header: string[], rows: TemplateRow[] } => {
  const lines = csv.replace(/^\uFEFF/, '').split(/\r\n|\n/).filter(line => line.trim() !== '')
  const [headerLine, ...dataLines] = lines
  return {
    header: splitCsvLine(headerLine),
    rows: dataLines.map((line) => {
      const cells = splitCsvLine(line)
      return {
        templateVersion: cells[0] ?? '',
        recordType: cells[1] ?? '',
        recordId: cells[2] ?? '',
        parentRecordId: cells[3] ?? '',
        field: cells[4] ?? '',
        value: cells[5] ?? '',
      }
    }),
  }
}
