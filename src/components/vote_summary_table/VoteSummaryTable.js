import SimpleTable from "../SimpleTable";
import {h} from "react-hyperscript-helpers";
import {Styles} from "../../libs/theme";
import {isEmpty} from "lodash/fp";
import {useState} from "react";
import {User} from "../../libs/ajax";


const styles = {
  baseStyle: {
    fontFamily: 'Montserrat Regular',
    fontSize: '14px',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
    justifyContent: 'space-between',
  }),
  cellWidths: {
    vote: '25%',
    name: '20%',
    date: '25%',
    rationale: '20%',
  },
};

function voteCellData({vote = '- -', voteId, label = 'vote'}) {
  return {
    data: vote,
    id: voteId,
    cellStyle: { width: styles.cellWidth.date },
    sortable: true,
    label
  };
}

function nameCellData({name = '- -', voteId, label = 'name'}) {
  return {
    data: name,
    id: voteId,
    cellStyle: { width: styles.cellWidth.name },
    sortable: true,
    label
  };
}

function dateCellData({date = '- -', voteId, label = 'date'}) {
  return {
    data: date,
    id: voteId,
    cellStyle: { width: styles.cellWidth.date },
    sortable: true,
    label
  };
}

function rationaleCellData({rationale = '- -', voteId, label = 'rationale'}) {
  return {
    data: rationale,
    id: voteId,
    cellStyle: { width: styles.cellWidth.rationale },
    sortable: true,
    label
  };
}

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
  if(!isEmpty(dacVotes)) {
    return dacVotes.map((dacVote) => {
      const { voteId, vote, dacUserId, createDate, updateDate, rationale } = dacVote;
      const user = User.getById(dacUserId);
      const { displayName } = user;  //TODO: check case of null info
      return [
        voteCellData({vote, voteId}),
        nameCellData({name: displayName, voteId}),
        dateCellData({date: updateDate || createDate, voteId}),
        rationaleCellData({rationale, voteId})
      ];
    });
  }
};


export default function VoteSummaryTable(props) {
  const [sort, setSort] = useState({ colIndex: 0, dir: 1 });
  const [tableSize, setTableSize] = useState(10);
  const { dacVotes, isLoading } = props;

  return h(SimpleTable, {
    isLoading,
    "rowData": processVoteSummaryRowData(dacVotes),
    "columnHeaders": columnHeaderData(),
    styles,
    tableSize: tableSize,
    sort,
    onSort: setSort
  });
}