import React from 'react';
import SimpleTable from '../SimpleTable';
import {Styles} from '../../libs/theme';
import {isNil, isEmpty} from 'lodash/fp';
import {useEffect, useState} from 'react';
import {sortVisibleTable} from '../../libs/utils';
import { Email } from '../../libs/ajax';

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
    whiteSpace: 'pre-line'
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
  }
};

const columnHeaderFormat = {
  vote: {label: 'Vote', cellStyle: {width: styles.cellWidths.vote}, sortable: true},
  name: {label: 'Name', cellStyle: {width: styles.cellWidths.name}, sortable: true},
  date: {label: 'Date', cellStyle: {width: styles.cellWidths.date}, sortable: true},
  rationale: {label: 'Rationale', cellStyle: {width: styles.cellWidths.rationale}, sortable: true},
};

const columnHeaderData = () => {
  const { vote, name, date, rationale } = columnHeaderFormat;
  return [vote, name, date, rationale];
};

const processVoteSummaryRowData = ({ dacVotes, isChair }) => {
  if(!isNil(dacVotes)) {
    return dacVotes.map((dacVote) => {
      const { vote, displayName, voteId, lastUpdated, rationale } =
        dacVote;
      return [
        voteCellData({ vote, voteId, isChair }),
        nameCellData({ name: displayName, voteId }),
        dateCellData({ date: lastUpdated, voteId }),
        rationaleCellData({ rationale, voteId }),
      ];
    });
  }
};


const voteToString = (vote) => {
  return isNil(vote) ? '- -' : (vote ? 'Yes' : 'No');
};

const reminderLink = (voteId) => {
  return <a onClick={() => {Email.sendReminderEmail(voteId);}}>
  Send Reminder
  </a>;
};

function voteCellData({vote, voteId, isChair, label = 'vote'}) {
  const data = (
    isChair && (isNil(vote) || isNil(voteId))
      ? reminderLink(voteId)
      : voteToString(vote)
  );

  return {
    data: data,
    value: isNil(vote) ? '-' : (vote ? 'Yes' : 'No'),
    id: voteId,
    cellStyle: { width: styles.cellWidths.vote },
    label
  };
}

function nameCellData({name = '- -', voteId, label = 'name'}) {
  return {
    data: name,
    id: voteId,
    cellStyle: { width: styles.cellWidths.name },
    label
  };
}

function dateCellData({date, voteId, label = 'date'}) {
  return {
    data: date,
    id: voteId,
    cellStyle: { width: styles.cellWidths.date },
    label
  };
}

function rationaleCellData({rationale = '- -', voteId, label = 'rationale'}) {
  return {
    data: rationale,
    id: voteId,
    cellStyle: { width: styles.cellWidths.rationale },
    label
  };
}


export default function VoteSummaryTable(props) {
  const [sort, setSort] = useState({ colIndex: 0, dir: 1 });
  const [visibleVotes, setVisibleVotes] = useState([]);
  const [tableSize, setTableSize] = useState(5);
  const { dacVotes, isLoading, isChair = false } = props;

  useEffect(() => {
    setVisibleVotes(
      sortVisibleTable({
        list: processVoteSummaryRowData({ dacVotes, isChair }),
        sort
      })
    );
    if(!isEmpty(dacVotes)){ setTableSize(dacVotes.length);}
  }, [sort, dacVotes, isChair]);

  return <SimpleTable
    isLoading={isLoading}
    rowData={visibleVotes}
    columnHeaders={columnHeaderData()}
    tableSize={tableSize}
    styles={styles}
    sort={sort}
    onSort={setSort}
  />;
}