import React, {useEffect, useState} from 'react';
import {isEmpty} from 'lodash';
import ReactTooltip from 'react-tooltip';
import PaginationBar from 'src/components/PaginationBar';
import SimpleTable from 'src/components/SimpleTable';
import {Storage} from 'src/libs/storage';
import {
  calcPageCount,
  CellData,
  columnHeaderData,
  columns,
  getInitialSort,
  processRows,
  SortType,
  storageInstitutionSort,
  tableStyles
} from 'src/components/institution_table/InstitutionTableUtils';
import {Institution} from 'src/types/model';
import {recalculateVisibleTable} from 'src/libs/utils';

export interface InstitutionTableProps {
  readonly filteredList: Institution[];
  readonly currentPage: number;
  readonly setCurrentPage: (page: number) => void;
  readonly tableSize: number;
  readonly setTableSize: (size: number) => void;
}

export default function InstitutionTable(props: InstitutionTableProps) {
  const {filteredList, currentPage, setCurrentPage, tableSize, setTableSize} = props;
  const [pageCount, setPageCount] = useState<number>(calcPageCount(tableSize, filteredList));
  const [visibleRows, setVisibleRows] = useState<CellData[][]>([]);
  const [sort, setSort] = useState<SortType>(getInitialSort(columns));

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: processRows(filteredList),
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleRows,
      sort
    });
    ReactTooltip.rebuild();
  }, [tableSize, pageCount, filteredList, currentPage, setPageCount, setCurrentPage, sort]);

  const changeTableSize = (newTableSize: number) => {
    if (!isEmpty(newTableSize) && newTableSize > 0) {
      setTableSize(newTableSize);
    }
  };

  const goToPage = (page: number) => {
    if (page > 0 && page < pageCount + 1) {
      setCurrentPage(page);
    }
  };

  return (
      <div data-cy="institution-table">
        <SimpleTable
            isLoading={false}
            rowData={visibleRows}
            columnHeaders={columnHeaderData(columns)}
            styles={tableStyles}
            rowWrapper={({renderedRow}: { renderedRow: React.ReactNode }) => renderedRow}
            paginationBar={
              <PaginationBar
                  pageCount={pageCount}
                  currentPage={currentPage}
                  tableSize={tableSize}
                  goToPage={goToPage}
                  changeTableSize={changeTableSize}
              />
            }
            sort={sort}
            onSort={(sort: SortType) => {
              Storage.setCurrentUserSettings(storageInstitutionSort, {
                field: columns[sort.colIndex],
                dir: sort.dir
              });
              setSort(sort);
            }}
        >
        </SimpleTable>
      </div>
  );
}
