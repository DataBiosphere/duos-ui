import React, {useEffect, useState} from 'react';
import {isEmpty} from 'lodash';
import ReactTooltip from 'react-tooltip';
import PaginationBar from '../PaginationBar';
import SimpleTable from 'src/components/SimpleTable';
import {Storage} from 'src/libs/storage';
import {
  CellData,
  columnConfig,
  processRowData,
  tableStyles
} from 'src/components/institution_table/InstitutionTableUtils';
import {Institution} from 'src/types/model';
import {recalculateVisibleTable} from 'src/libs/utils';

interface SortType {
  colIndex: number;
  dir: number;
}

interface InstitutionTableProps {
  readonly filteredList: Institution[];
  readonly currentPage: number;
  readonly setCurrentPage: (page: number) => void;
  readonly tableSize: number;
  readonly setTableSize: (size: number) => void;
}

const calcPageCount = (tableSize: number, filteredList: Institution[]) => {
  if (isEmpty(filteredList)) {
    return 1;
  }
  return Math.ceil(filteredList.length / tableSize);
};

const storageInstitutionSort = 'storageInstitutionSort';

const getInitialSort = (columns: string[] = []): SortType => {
  const sort = Storage.getCurrentUserSettings(storageInstitutionSort) || {
    field: 'name',
    dir: 1
  };
  const sortIndex = columns.indexOf(sort.field);
  if (sortIndex !== -1) {
    return {colIndex: sortIndex, dir: sort.dir};
  } else {
    return {colIndex: 0, dir: 1};
  }
};

const columns = Object.keys(columnConfig);

const columnHeaderData = (columns: string[]) => {
  return columns.map((col) => columnConfig[col]);
};

const processInstitutions = (institutions: Institution[]): CellData[][] => {
  return institutions.map((institution) => {
    return processRowData(institution);
  });
}

export default function InstitutionTable(props: InstitutionTableProps) {
  const {filteredList, currentPage, setCurrentPage, tableSize, setTableSize} = props;
  const [pageCount, setPageCount] = useState<number>(calcPageCount(tableSize, filteredList));
  const [visibleInstitutions, setVisibleInstitutions] = useState<CellData[][]>([]);
  const [sort, setSort] = useState<SortType>(getInitialSort(columns));

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: processInstitutions(filteredList),
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleInstitutions,
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
      <div>
        <SimpleTable
            isLoading={false}
            rowData={visibleInstitutions}
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
};
