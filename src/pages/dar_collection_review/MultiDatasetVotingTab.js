import MultiDatasetVoteSlab from "../../components/collection_voting_slab/MultiDatasetVoteSlab";
import {div, h} from "react-hyperscript-helpers";
import ResearchProposalVoteSlab from "../../components/collection_voting_slab/ResearchProposalVoteSlab";
import {useEffect, useState} from "react";
import {find, get} from 'lodash/fp';

const styles = {
  baseStyle: {
    backgroundColor: '#FFFFFF'
  },
  title: {
    color: '#333F52',
    fontFamily: 'Montserrat',
    fontSize: '2.4rem',
    fontWeight: 'bold'
  }
};

export default function MultiDatasetVotingTab(props) {
  const [rpBucket, setRpBucket] = useState({});
  const {darInfo, dataUseBuckets, isChair, isLoading} = props;

  const [bucket, setBucket] = useState({
    elections: [
      [
        {dataSetId: 385, electionId: 102, status: 'Open', electionType: 'DataAccess'},
        {electionType: 'RP Vote'}
      ],
      [
        {dataSetId: 415, electionId: 104, status: 'Open', electionType: 'DataAccess'},
        {electionType: 'RP Vote'}
      ],
      [
        {dataSetId: 103, electionId: 103, status: 'Closed', electionType: 'DataAccess'},
        {electionType: 'RP Vote'}
      ]
    ],
    votes: [
      {
        rp: {
          finalVotes: [{dacUserId: 5060, displayName: 'Shae', vote: true, rationale: 'test', electionId: 102, voteId: 1, createDate: 14124124414}],
          chairpersonVotes: [{dacUserId: 5060, displayName: 'Shae', vote: true, rationale: 'test', electionId: 102, voteId: 1, createDate: 14124124414}],
          memberVotes: [
            {dacUserId: 5060, displayName: 'Shae', rationale: 'test1', electionId: 102, voteId: 1, createDate: 14124124414},
            {dacUserId: 5007, displayName: 'Grace', rationale: 'test1', vote: false, electionId: 102, voteId: 2, createDate: 40815342},
            {dacUserId: 3365, displayName: 'Julian', vote: true, electionId: 102, voteId: 3, createDate: 9999999}
          ]
        },
        dataAccess: {
          finalVotes: [{dacUserId: 5060, displayName: 'Shae', vote: true, rationale: 'test1', electionId: 102, voteId: 1, createDate: 14124124414}],
          chairpersonVotes: [{dacUserId: 5060, displayName: 'Shae', vote: true, rationale: 'test1', electionId: 102, voteId: 1, createDate: 14124124414}],
          memberVotes: [
            {dacUserId: 5060, displayName: 'Shae', rationale: 'test1', electionId: 102, voteId: 1, createDate: 14124124414},
            {dacUserId: 5007, displayName: 'Grace', rationale: 'test1', vote: false, electionId: 102, voteId: 2, createDate: 40815342},
            {dacUserId: 3365, displayName: 'Julian', vote: true, electionId: 102, voteId: 3, createDate: 9999999}
          ]
        }
      },
      {
        rp: {
          finalVotes: [{dacUserId: 5060, displayName: 'Shae', vote: true, rationale: 'test', electionId: 104, voteId: 5, createDate: 22122412512}],
          chairpersonVotes: [{dacUserId: 5060, displayName: 'Shae', vote: true, rationale: 'test', electionId: 104, voteId: 5, createDate: 22122412512}],
          memberVotes: [
            {dacUserId: 5060, displayName: 'Shae', rationale: 'test2', electionId: 104, voteId: 5, createDate: 22122412512},
            {dacUserId: 5007, displayName: 'Grace', rationale: 'test1', vote: false, electionId: 104, voteId: 4, createDate: 40815342},
            {dacUserId: 3365, displayName: 'Julian', vote: false, electionId: 104, voteId: 6}
          ]
        },
        dataAccess: {
          finalVotes: [{dacUserId: 5060, displayName: 'Shae', vote: false, rationale: 'test2', electionId: 104, voteId: 5, createDate: 22122412512}],
          chairpersonVotes: [{dacUserId: 5060, displayName: 'Shae', vote: false, rationale: 'test2', electionId: 104, voteId: 5, createDate: 22122412512}],
          memberVotes: [
            {dacUserId: 5060, displayName: 'Shae', rationale: 'test2', electionId: 104, voteId: 5, createDate: 22122412512},
            {dacUserId: 5007, displayName: 'Grace', rationale: 'test1', vote: false, electionId: 104, voteId: 4, createDate: 40815342},
            {dacUserId: 3365, displayName: 'Julian', vote: false, electionId: 104, voteId: 6}
          ]
        }
      },
      {
        rp: {
          finalVotes: [],
          chairpersonVotes: [],
          memberVotes: [
            {dacUserId: 5007, displayName: 'Grace', vote: false, electionId: 103, voteId: 7},
            {dacUserId: 3365, displayName: 'Julian', vote: true, electionId: 103, voteId: 8}
          ]
        },
        dataAccess: {
          finalVotes: [],
          chairpersonVotes: [],
          memberVotes: [
            {dacUserId: 5007, displayName: 'Grace', vote: false, electionId: 103, voteId: 7},
            {dacUserId: 3365, displayName: 'Julian', vote: true, electionId: 103, voteId: 8}
          ]
        }
      },
    ],
    dataUses: [
      {code: 'GRU', description: 'Use is permitted for any research purpose'},
      {code: 'HMB', description: 'Use is permitted for a health, medical, or biomedical research purpose'}
    ]
  });

  useEffect(() => {
    setRpBucket(find(bucket => get('key')(bucket) === 'RP Vote')(dataUseBuckets));
  }, [dataUseBuckets]);

  return div({style: styles.baseStyle}, [
    div({style: styles.title}, ["Research Proposal"]),
    h(ResearchProposalVoteSlab, {
      darInfo,
      bucket: rpBucket,
      isChair,
      isLoading
    })
  ]);
}