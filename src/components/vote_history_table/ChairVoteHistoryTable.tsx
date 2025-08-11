import React from 'react';
import SimpleTable from '../SimpleTable';
import { VoteHistoryRow } from 'src/types/model';
import { Styles } from 'src/libs/theme';
import { formatDate } from 'src/libs/utils';

interface ChairVoteHistoryTableProps {
    voteHistory: VoteHistoryRow[];
}

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    fontWeight: 400,
    color: '#333F52',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    padding: '1rem 2%',
    lineHeight: '2rem',
    justifyContent: 'space-between',
    alignItems: 'center',
    whiteSpace: 'pre-line',
  },
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    color: '#333F52',
    justifyContent: 'space-between',
  }),
  containerOverride: {
    marginTop: '0',
    borderTop: '0',
    backgroundColor: 'rgba(184, 205, 211, 0)',
    padding: '0',
  },
}

const ChairVoteHistoryTable: React.FC<ChairVoteHistoryTableProps> = ({ voteHistory}) => {
    
    const columnHeaderFormat = {
        requestType: { label: 'Request Type', cellStyle: { width: '10%' }, sortable: true },
        darCode: { label: 'DAR Title', cellStyle: { width: '20%' }, sortable: true },
        electionDate: { label: 'Election Date', cellStyle: { width: '10%' }, sortable: true },
        vote: { label: 'Vote', cellStyle: { width: '10%' }, sortable: true },
        name: { label: 'Voter', cellStyle: { width: '15%' }, sortable: true },
        voteDate: { label: 'Vote Date', cellStyle: { width: '10%' }, sortable: true },
        voteType: { label: 'Vote Type', cellStyle: { width: '10%' }, sortable: true },
        rationale: { label: 'Rationale', cellStyle: { width: '20%' }, sortable: true }
    };

    const columnHeaderData = () => {
        const { requestType, darCode, electionDate, vote, name, voteDate, voteType, rationale } = columnHeaderFormat;
        return [requestType, darCode, electionDate, vote, name, voteDate, voteType, rationale];
    };

    const processVoteHistoryRowData = (voteHistory: VoteHistoryRow[]) => {
        if (!voteHistory) return [];
        
        const rowData = voteHistory.map((row: VoteHistoryRow, i) => [
            { data: row.progressReport ? 'Progress Report' : 'Initial Dar', cellStyle: { width: '10%' }, label: 'Request Type', id: i },
            { data: row.darTitle, cellStyle: { width: '20%' }, label: 'DAR Title', id: i },
            { data: formatDate(row.electionDate), cellStyle: { width: '10%' }, label: 'Election Date', id: i },
            { data: row.vote == true ? 'Yes' : row.vote == false ? 'No' : "--", cellStyle: { width: '10%' }, label: 'Vote', id: i },
            { data: row.displayName, cellStyle: { width: '15%' }, label: 'Name', id: i },
            { data: formatDate(row.createDate), cellStyle: { width: '10%' }, label: 'Vote Date', id: i },
            { data: row.type, cellStyle: { width: '10%' }, label: 'Vote Type', id: i },
            { data: row.rationale || '--', cellStyle: { width: '20%' }, label: 'Rationale', id: i },
        ]);
        return rowData;
    };

    return (
        <SimpleTable 
            columnHeaders={columnHeaderData()} 
            rowData={processVoteHistoryRowData(voteHistory)} 
            styles={styles}
        />
    );
};

export default ChairVoteHistoryTable;