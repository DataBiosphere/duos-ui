import SimpleTable from "../SimpleTable";
import {div, h} from "react-hyperscript-helpers";
import PaginationBar from "../PaginationBar";
import {getProjectTitle, styles} from "../dar_collection_table/DarCollectionTable";
import {Styles} from "../../libs/theme";
import cellData from "../dar_collection_table/DarCollectionTableCellData";
import {isEmpty, isNil} from "lodash/fp";
import {useState} from "react";
import {User} from "../../libs/ajax";


const styles = {
  baseStyle: {
    fontFamily: 'Arial',
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

const columnHeaderConfig = {
  vote: {
    label: 'Vote',
    cellStyle: { width: styles.cellWidth.vote },
    cellDataFn: ,
    sortable: true
  },
  name: {
    label: 'Name',
    cellStyle: { width: styles.cellWidth.name },
    cellDataFn: ,
    sortable: true
  },
  date: {
    label: 'Date',
    cellStyle: { width: styles.cellWidth.date },
    cellDataFn: ,
    sortable: true
  },
  rationale: {
    label: 'Rationale',
    cellStyle: { width: styles.cellWidth.rationale },
    cellDataFn: ,
    sortable: true
  }
};

function voteCellData({vote = '- -', voteId, label = 'vote'}) {
  return {
    data: vote,
    id: voteId,
    label
  };
}

function nameCellData({name = '- -', voteId, label = 'name'}) {
  return {
    data: name,
    id: voteId,
    label
  };
}

function dateCellData({date = '- -', voteId, label = 'date'}) {
  return {
    data: date,
    id: voteId,
    label
  };
}

function rationaleCellData({rationale = '- -', voteId, label = 'rationale'}) {
  return {
    data: rationale,
    id: voteId,
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
  const { dacVotes } = props;

  return h(SimpleTable, {
    isLoading,
    "rowData": visibleCollection,
    "columnHeaders": columnHeaderData(columns),
    styles,
    tableSize: tableSize,
    sort,
    onSort: setSort
  })
}