import SimpleTable from "../SimpleTable";
import {h} from "react-hyperscript-helpers";
import {Styles} from "../../libs/theme";
import {isNil} from "lodash/fp";
import {useState} from "react";
import {formatDate} from "../../libs/utils";


const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    fontWeight: 400,
    color: '#333F52',
    display: 'flex',
    padding: '1rem 2%',
    lineHeight: '1.6rem',
    justifyContent: 'space-between',
    alignItems: 'center'
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
};

const columnHeaderFormat = {
  vote: {label: 'Vote', cellStyle: {width: styles.cellWidths.vote}},
  name: {label: 'Name', cellStyle: {width: styles.cellWidths.name}},
  date: {label: 'Date', cellStyle: {width: styles.cellWidths.date}},
  rationale: {label: 'Rationale', cellStyle: {width: styles.cellWidths.rationale}},
};

const columnHeaderData = () => {
  const { vote, name, date, rationale } = columnHeaderFormat;
  return [vote, name, date, rationale];
};

const processVoteSummaryRowData = ({ dacVotes }) => {
  if(!isNil(dacVotes)) {
    return dacVotes.map((dacVote) => {
      const { vote, displayName } = dacVote;
      const { voteId, createDate, updateDate, rationale, requestRevision } = vote;
      return [
        voteCellData({vote, requestRevision, voteId}),
        nameCellData({name: displayName, voteId}),
        dateCellData({date: updateDate || createDate, voteId}),
        rationaleCellData({rationale, voteId})
      ];
    });
  }
};


function voteCellData({vote, requestRevision, voteId, label = 'vote'}) {
  const voteResult = requestRevision ? "Request Revision" :
    isNil(vote.vote) ? "- -" :
      vote.vote ? "Yes" : "No";

  return {
    data: voteResult,  //TODO need request revision case + format better
    id: voteId,
    cellStyle: { width: styles.cellWidths.vote },
    sortable: true,
    label
  };
}

function nameCellData({name = '- -', voteId, label = 'name'}) {
  return {
    data: name,
    id: voteId,
    cellStyle: { width: styles.cellWidths.name },
    sortable: true,
    label
  };
}

function dateCellData({date, voteId, label = 'date'}) {
  return {
    data: isNil(date) ? '- - ' : formatDate(date),
    id: voteId,
    cellStyle: { width: styles.cellWidths.date },
    sortable: true,
    label
  };
}

function rationaleCellData({rationale = '- -', voteId, label = 'rationale'}) {
  return {
    data: rationale,
    id: voteId,
    cellStyle: { width: styles.cellWidths.rationale },
    sortable: true,
    label
  };
}


export default function VoteSummaryTable(props) {
  const [sort, setSort] = useState({ colIndex: 0, dir: 1 });
  const [tableSize, setTableSize] = useState(10);
  const { dacVotes, isLoading } = props;

  return h(SimpleTable, {
    isLoading,
    "rowData": processVoteSummaryRowData({ dacVotes }),
    "columnHeaders": columnHeaderData(),
    styles,
    tableSize,
    sort,
    onSort: setSort
  });
}