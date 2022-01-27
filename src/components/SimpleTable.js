import { isNil } from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { Styles } from '../libs/theme';
import ReactTooltip from 'react-tooltip';
import { useEffect } from 'react';

//Component that renders skeleton loader on loading
const SkeletonLoader = ({columnRow, columnHeaders, baseStyle, tableSize}) => {
  const rowTemplateArray = (columnRow, columnHeaders) => {
    const rowsSkeleton = [columnRow];
    let i = 0;
    while(i < tableSize) {
      let row = columnHeaders.map(({cellStyle}, index) => {
        const style = Object.assign({height: '0.5rem'}, baseStyle, cellStyle);
        return div({style, className: 'text-placeholder', key: `placeholder-row-${i}-cell-${index}`});
      });
      rowsSkeleton.push(div({style: baseStyle, key: `placeholder-row-${i}-container`}, row));
      i++;
    }
    return rowsSkeleton;
  };
  return rowTemplateArray(columnRow, columnHeaders);
};

//Simple cell text display
const SimpleTextCell = ({ text, style, keyProp }) => {
  text = isNil(text) ? '- -' : text;
  return div({ style, role: 'cell', key: keyProp }, [text]);
};

//Simple cell text that carries onClick functionality
const OnClickTextCell = ({ text, style, onClick, keyProp }) => {
  text = isNil(text) ? '- -' : text;
  return div({ style, onClick, role: 'cell', key: keyProp }, [text]);
};

//Column component that renders the column row based on column headers
const ColumnRow = ({columnHeaders, baseStyle, columnStyle}) => {
  const rowStyle = Object.assign({}, baseStyle, columnStyle);
  return div({style: rowStyle, key: `column-row-container`, role:'row'}, columnHeaders.map((header) => {
    const {cellStyle, label} = header;
    //style here pertains to styling for individual cells
    //should be used to set dimensions of specific columns
    return div({style: cellStyle, key: `column-row-${label}`}, [label]);
  }));
};

//Row component that renders out rows for each element in the provided data collection
const DataRows = ({rowData, baseStyle, columnHeaders}) => {
  const rows = rowData.map((row, index) => {
    const id = rowData[index][0].id;
    return div({style: Object.assign({border: '1px solid #f3f6f7'}, baseStyle), key: `row-data-${id}`, role: 'row'},
      row.map(({data, style, onClick, isComponent, id, label}, cellIndex) => {
        let output;
        //columnHeaders determine width of the columns,
        //therefore extract width from columnHeader and apply to cell style
        const columnWidthStyle = columnHeaders[cellIndex].cellStyle;
        const appliedStyle = Object.assign({}, style, columnWidthStyle);
        //assume component is in hyperscript format
        //wrap component in dive with columnWidth applied
        if (isComponent) {
          output = div({style: columnWidthStyle, key: `${!isNil(data) && !isNil(data.key) ? data.key : 'component-' + index + '-' + cellIndex}-container`}, [data]);
        //if there is no onClick function, render as simple cell
        } else if (isNil(onClick)) {
          output = h(SimpleTextCell, { text: data, style: appliedStyle, keyProp: `filtered-list-${id}-${label}`, cellIndex });
        } else {
          //otherwise render as on click cell
          output = h(OnClickTextCell, { text: data, style: appliedStyle, onClick: () => onClick(index), keyProp: `filtered-list-${id}-${label}`, cellIndex });
        }
        return output;
      }));
  });
  return rows;
};

//Simple table component, can be used alone, can be built on top of (like with LibraryCardTable)
//component handles simple rendering of table, however logic behind pagination and row format has to be computed as the parent
export default function SimpleTable(props) {
  //rowData -> array of arrays, outer array represents the collection of rows, inner array represents the collection of cells within a particular row
  //ex -> [[{cellData1Row1}], [{cellData1Row2}]], where inner objects contain relevant data for render (text, style, component (if provided))
  //columnHeaders is an array of objects, [{label, cellStyle}], where style is used to set up dimentions of the cell for the columns

  const {
    columnHeaders = [],
    rowData = [], //rowData -> {data, component, style, onClick}
    isLoading,
    styles, //styles -> baseStyle, columnStyle needed to determine sizing and color assignments
    tableSize,
    paginationBar,
  } = props;

  useEffect(() => {
    ReactTooltip.rebuild();
  }, [rowData]);

  const {baseStyle, columnStyle} = styles;
  const columnRow = h(ColumnRow, {key: 'column-row-container', columnHeaders, baseStyle, columnStyle});
  const tableTemplate = [columnRow, h(DataRows, {rowData, baseStyle, columnHeaders})];
  const output = isLoading ? h(SkeletonLoader, {columnRow, columnHeaders, baseStyle, tableSize}) : tableTemplate;
  return div({className: 'table-data', style: Styles.TABLE.CONTAINER, role: 'table'}, [output, isNil(paginationBar) ? div() : paginationBar]);
}
