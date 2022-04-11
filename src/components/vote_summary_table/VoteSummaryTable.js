import SimpleTable from "../SimpleTable";
import {h} from "react-hyperscript-helpers";
import {Styles} from "../../libs/theme";
import {isNil} from "lodash/fp";
import {useCallback, useEffect, useState} from "react";
import {formatDate, sortVisibleTable} from "../../libs/utils";

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

const processVoteSummaryRowData = ({ dacVotes }) => {
  if(!isNil(dacVotes)) {
    return dacVotes.map((dacVote) => {
      const { vote, displayName, voteId, createDate, updateDate, rationale } = dacVote;
      return [
        voteCellData({vote, voteId}),
        nameCellData({name: displayName, voteId}),
        dateCellData({date: updateDate || createDate, voteId}),
        rationaleCellData({rationale, voteId})
      ];
    });
  }
};


function voteCellData({vote, voteId, label = 'vote'}) {
  return {
    data: isNil(vote) ? "- -" : vote ? "Yes" : "No",
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
  const { dacVotes, isLoading } = props;

  useEffect(() => {
    setVisibleVotes(
      sortVisibleTable({
        list: processVoteSummaryRowData({ dacVotes }),
        sort
      })
    );
    changeTableSize(visibleVotes.length);
  }, [sort, dacVotes]);

  const changeTableSize = useCallback((value) => {
    if (value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value);
    }
  }, []);

  return h(SimpleTable, {
    isLoading,
    "rowData": visibleVotes,
    "columnHeaders": columnHeaderData(),
    tableSize,
    styles,
    sort,
    onSort: setSort
  });
}