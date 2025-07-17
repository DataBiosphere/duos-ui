import React from 'react';
import { isEmpty, isNil } from 'lodash/fp';
import { useState, useEffect } from 'react';
import { Styles } from '../../libs/theme';
import ReactTooltip from 'react-tooltip';
import PaginationBar from '../PaginationBar';
import { Link } from 'react-router-dom';

export const TableHeader = (
  <>
    <div style={Styles.TABLE.ID_CELL}>ID</div>
    <div style={Styles.TABLE.INSTITUTION_CELL}>Institution</div>
    <div style={Styles.TABLE.INSTITUTION_CELL}>Signing Officials</div>
    <div style={Styles.TABLE.DATA_ID_CELL}>Create User</div>
    <div style={Styles.TABLE.SUBMISSION_DATE_CELL}>Create Date</div>
    <div style={Styles.TABLE.DATA_ID_CELL}>Update User</div>
    <div style={Styles.TABLE.SUBMISSION_DATE_CELL}>Update Date</div>
  </>
);

const loadingMarginOverwrite = {margin: '1rem 2%'};

export const TableRowLoading = (
  <>
    <div style={{...Styles.TABLE.ID_CELL, ...loadingMarginOverwrite}} className="text-placeholder" />
    <div style={{...Styles.TABLE.INSTITUTION_CELL, ...loadingMarginOverwrite}} className="text-placeholder" />
    <div style={{...Styles.TABLE.INSTITUTION_CELL, ...loadingMarginOverwrite}} className="text-placeholder" />
    <div style={{...Styles.TABLE.DATA_ID_CELL, ...loadingMarginOverwrite}} className="text-placeholder" />
    <div style={{...Styles.TABLE.SUBMISSION_DATE_CELL, ...loadingMarginOverwrite}} className="text-placeholder" />
    <div style={{...Styles.TABLE.DATA_ID_CELL, ...loadingMarginOverwrite}} className="text-placeholder" />
    <div style={{...Styles.TABLE.SUBMISSION_DATE_CELL, ...loadingMarginOverwrite}} className="text-placeholder" />
  </>
);

const calcPageCount = (tableSize, filteredList) => {
  if(isEmpty(filteredList)) {
    return 1;
  }
  return Math.ceil(filteredList.length / tableSize);
};

export default function InstitutionTable(props) {
  const { filteredList, currentPage, setCurrentPage, tableSize, setTableSize, institutionList } = props;
  const [pageCount, setPageCount] = useState(calcPageCount(tableSize, filteredList));

  useEffect(() => {
    setPageCount(calcPageCount(tableSize, filteredList));

    ReactTooltip.rebuild();
  }, [currentPage, tableSize, filteredList]);

  const changeTableSize = (newTableSize) => {
    if(!isEmpty(newTableSize) && newTableSize > 0) {
      setTableSize(newTableSize);
    }
  };

  const goToPage = (currentPage) => {
    if(currentPage > 0 && currentPage < pageCount + 1) {
      setCurrentPage(currentPage);
    }
  };

  return (
    <div className='institution-table-component'>
      <div style={Styles.TABLE.CONTAINER}>
        <div style={Styles.TABLE.HEADER_ROW}>
          <TableHeader />
        </div>
        {filteredList.slice((currentPage - 1) * tableSize, (currentPage * tableSize)).map((inst, index) => {
          const signingOfficialsList = [];
          if (!isNil(inst.signingOfficials)) {
            inst.signingOfficials.forEach((user) => {
              signingOfficialsList.push(
                <span style={{display: 'block'}} key={user.userId}>
                  {user.displayName} ({user.email})
                </span>
              );
            });
          }
          const borderStyle = index > 0 ? {borderTop: '1px solid rgba(109,110,112,0.2)'} : {};
          return (
            <div style={Object.assign({}, borderStyle, Styles.TABLE.RECORD_ROW)} key={`${inst.id}-${index}`}>
              <div style={Object.assign({}, Styles.TABLE.ID_CELL)}>{inst.id}</div>
              <div style={Object.assign({}, Styles.TABLE.INSTITUTION_CELL)}>
                  <Link
                      to={{
                          pathname: `/admin_manage_institutions/${inst.id}`,
                          // If we have the institution list already loaded, pass it along to the Edit Institution
                          // page so we can check for duplicate domains before hitting the backend or fetching the
                          // entire institution list again. If this value is not present or not yet loaded, the Edit
                          // Institution page will rely on backend validation.
                          state: { institutionList }
                      }}
                      style={{
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        textDecoration: 'none',
                        color: '#1f75b6',
                        cursor: 'pointer'
                      }}
                >
                  {inst.name}
                </Link>
              </div>
              <div style={Object.assign({}, {...Styles.TABLE.INSTITUTION_CELL, display: 'block'})}>{signingOfficialsList}</div>
              <div style={Object.assign({}, Styles.TABLE.DATA_ID_CELL)}>{inst.createUser ? inst.createUser.displayName : ''}</div>
              <div style={Object.assign({}, Styles.TABLE.SUBMISSION_DATE_CELL)}>{inst.createDate}</div>
              <div style={Object.assign({}, Styles.TABLE.DATA_ID_CELL)}>{inst.updateUser ? inst.updateUser.displayName : ''}</div>
              <div style={Object.assign({}, Styles.TABLE.SUBMISSION_DATE_CELL)}>{inst.updateDate}</div>
            </div>
          );
        })}
        <PaginationBar pageCount={pageCount} currentPage={currentPage} tableSize={tableSize} goToPage={goToPage} changeTableSize={changeTableSize} />
      </div>
      <ReactTooltip
        place='left'
        effect='solid'
        multiline={true}
        className='tooltip-wrapper'
      />
    </div>
  );
}
