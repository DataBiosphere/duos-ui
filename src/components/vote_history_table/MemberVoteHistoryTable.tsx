import React from 'react'
import SimpleTable from '../SimpleTable'
import { Styles } from 'src/libs/theme';
import { formatDate } from '../../libs/utils'
import { Vote } from 'src/types/model';

interface MemberVoteHistoryTableProps {
    memberVoteHistory: Vote[];
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
    cellWidths: {
      vote: '10%',
      name: '15%',
      date: '10%',
      rationale: '50%',
    },
    containerOverride: {
      marginTop: '0',
      borderTop: '0',
      backgroundColor: 'rgba(184, 205, 211, 0)',
      padding: '0',
    },
  }

const MemberVoteHistoryTable: React.FC<MemberVoteHistoryTableProps> = ({ memberVoteHistory }) => {
  
    const columnHeaderFormat = {
        memberName: { label: 'Member Name', cellStyle: { width: '15%' }, sortable: true },
        date: { label: 'Vote Date', cellStyle: { width: '10%' }, sortable: true },
        vote: { label: 'Vote', cellStyle: { width: '10%' }, sortable: true },
        rationale: { label: 'Rationale', cellStyle: { width: '55%' }, sortable: true }
    };

    const columnHeaderData = () => {
        const { memberName, date, vote, rationale } = columnHeaderFormat;
        return [ memberName,  date, vote, rationale ];
    };

    const processElectionRowData = (memberVoteHistory: Vote[]) => {
        if (!memberVoteHistory) return [];
        
        return memberVoteHistory.map((row: Vote, i) => [
            { data: row.displayName, cellStyle: { width: '15%' }, label: 'Member Name', id: i },
            { data: row.updateDate ? formatDate(row.updateDate) : '--', cellStyle: { width: '10%' }, label: 'Vote Date', id: i },
            { data: row.vote == true ? 'Yes' : row.vote == false ? 'No' : "--", cellStyle: { width: '10%' }, label: 'Vote', id: i },
            { data: row.rationale || "--", cellStyle: { width: '55%' }, label: 'Rationale', id: i }
        ]);
    };


    return (
        <SimpleTable 
            columnHeaders={columnHeaderData()} 
            rowData={processElectionRowData(memberVoteHistory)} 
            styles={styles}
        />
    );
};

export default MemberVoteHistoryTable;