import React, {useEffect, useState} from 'react';
import {isEmpty} from 'lodash/fp';
import ReactTooltip from 'react-tooltip';
import PaginationBar from '../PaginationBar';
import AddInstitutionModal from '../modals/AddInstitutionModal';
import SimpleTable from 'src/components/SimpleTable';
import {Storage} from 'src/libs/storage';
import {
  CellData,
  columnConfig,
  processRowData,
  tableStyles
} from 'src/components/institution_table/InstitutionTableUtils';
import {Institution} from 'src/types/model';

interface SortType {
  colIndex: number;
  dir: number;
}

interface InstitutionTableProps {
  readonly isLoading?: boolean;
  readonly institutionList: Institution[];
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

const defaultColumns = Object.keys(columnConfig);

export default function InstitutionTable(props: InstitutionTableProps) {
  const {isLoading, institutionList, currentPage, setCurrentPage, tableSize, setTableSize} = props;
  const [pageCount, setPageCount] = useState<number>(calcPageCount(tableSize, institutionList));
  const [showUpdateInstitutionModal, setShowUpdateInstitutionModal] = useState<boolean>(false);
  const [institutionId, setInstitutionId] = useState<number | string | undefined>();
  const [paginatedRows, setPaginatedRows] = useState<Array<CellData[]>>([]);
  const [sort, setSort] = useState<SortType>(getInitialSort(defaultColumns));

  useEffect(() => {
    setPageCount(calcPageCount(tableSize, institutionList));
    const rows: Array<CellData[]> = [];
    institutionList.forEach((row) => {
      const rowData = processRowData(row);
      rows.push(rowData);
    });
    setPaginatedRows(rows.slice((currentPage - 1) * tableSize, currentPage * tableSize));
    ReactTooltip.rebuild();
  }, [currentPage, tableSize, institutionList]);

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

  const closeUpdateModal = () => {
    setShowUpdateInstitutionModal(false);
    setInstitutionId(undefined);
  };

  return (
      <div>
        <SimpleTable
            isLoading={isLoading}
            rowData={paginatedRows}
            columnHeaders={defaultColumns.map((col) => columnConfig[col])}
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
                field: defaultColumns[sort.colIndex],
                dir: sort.dir
              });
              setSort(sort);
            }}
        >
        </SimpleTable>
        {showUpdateInstitutionModal && (
            <AddInstitutionModal
                showModal={showUpdateInstitutionModal}
                institutionId={institutionId}
                closeModal={closeUpdateModal}
                onOKRequest={() =>{}}
                onCloseRequest={closeUpdateModal}
            />
        )}
      </div>
  );
};
