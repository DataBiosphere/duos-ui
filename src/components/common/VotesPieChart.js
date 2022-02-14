import { Chart } from 'react-google-charts';
import { h, div } from 'react-hyperscript-helpers';
import { isNil } from 'lodash/fp';
import { map } from 'lodash'
import { useMemo } from 'react';

const processVotes = (votes) => {
  const headerData = ["Vote", "Total Votes"];
  const decisionMap = {};

  votes.forEach((v) => {
    const value = v.vote || "Not Submitted";
    if(isNil(decisionMap[value])) {
      decisionMap[value] = 1;
    } else {
      decisionMap[value]++;
    }
  });
  const decisionDataArray = map((count, key) => [key, count]);
  return [headerData, ...decisionDataArray];
};

export default function VotesPieChart(props) {
  const {
    votes,
    title = 'Pie Chart Results',
    pieHole = 0.3,
    height = 'inherit',
    width = 'inherit',
    style = { padding: '10px 5px'}
  } = props;

  const processedVotes = useMemo(() => processVotes(votes), [votes]);
  const options = {title, pieHole, is3d: false};

  return div({display: 'flex', style}, [
    h(Chart, {
      chartType:"PieChart",
      data: processedVotes,
      options: options,
      width,
      height
    })
  ]);
}