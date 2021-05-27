import {useState} from "react";
import {useEffect} from "react";
import {Metrics} from "../libs/ajax";
import {Notifications} from "../libs/utils";
import {div} from "react-hyperscript-helpers";
import {Styles} from "../libs/theme";
import {h} from "react-hyperscript-helpers";
import DarTableSkeletonLoader from "../components/TableSkeletonLoader";
import {tableHeaderTemplate} from "../components/dar_table/DarTable";
import {tableRowLoadingTemplate} from "../components/dar_table/DarTable";
import {filter, isNil} from "lodash/fp";
import get from "lodash/get";
import find from "lodash/find";
import {Theme} from "../libs/theme";
import {ReadMore} from "../components/ReadMore";

const ROW = {display: 'flex', fontSize: '18px'};

const LABEL = {fontWeight: '500', marginRight: '5px'};

const SECTION_HEADER = {marginTop: '15px', fontSize: '22px', fontWeight: '500'};

const LINE = div({style: {borderTop: '1px solid #BABEC1', height: 0}}, []);

const JUMBO = {fontSize: '60px', paddingTop: '25px', textAlign: 'center' };

const DESCRIPTION_BOX = {
  borderRadius: 9,
  backgroundColor: '#DFE8EE',
  height: 200,
  width: 600,
  padding: 0,
  margin: '.5rem 1rem .5rem 0',
  overflowX: 'hidden',
  overflowY: 'scroll',
  display: 'flex',
  flexDirection: 'column'
};

const BOX = {
  alignContent: 'center',
  borderRadius: 9,
  backgroundColor: '#DFE8EE',
  height: 200,
  width: 220,
  padding: 0,
  margin: '.5rem 1rem .5rem 0',
  overflowX: 'hidden',
  overflowY: 'scroll',
  display: 'flex',
  flexDirection: 'column'
};

const READ_MORE = {
  alignContent: 'center',
  borderRadius: 9,
  backgroundColor: '#DFE8EE',
  height: 160,
  width: 900,
  padding: 0,
  margin: '.5rem 1rem .5rem 0',
  overflowX: 'hidden',
  overflowY: 'scroll',
  display: 'flex',
  flexDirection: 'column'
};


export default function DatasetStatistics(props) {
  const datasetId = props.match.params.datasetId;
  const [dataset, setDataset] = useState();
  const [dars, setDars] = useState();
  const [elections, setElections] = useState();
  const [darsApproved, setDarsApproved] = useState();
  const [darsDenied, setDarsDenied] = useState();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(()  => {
    setData(datasetId);
  }, [datasetId]);

  const setData = async (datasetId) => {
    try {
      setIsLoading(true);
      const metrics = await Metrics.getDatasetStats(datasetId);
      setDataset(metrics.dataset);
      setDars(metrics.dars);
      setElections(metrics.elections);
      const approved = filter((election) => election.finalAccessVote === true)(elections);
      const denied = filter((election) => election.finalAccessVote === false)(elections);
      setDarsApproved(approved.length);
      setDarsDenied(denied.length);
      setIsLoading(false);
    } catch(error) {
      Notifications.showError({text: 'Error: Unable to retrieve dataset statistics from server'});
      setIsLoading(false);
    }
  };

  if (!isNil(elections)) {
    return (
      div({style: {...Styles.PAGE, color: Theme.palette.primary}}, [
        div({style: {justifyContent: "space-between"}}, [
          div({isRendered: !isLoading, style: {marginTop: '25px'}}, [
            div({style: Styles.TITLE}, ["Dataset Statistics"]),
            div({style: ROW}, [
              div({style: LABEL}, ["Dataset ID: "]),
              div([dataset.alias])
            ]),
            div({style: ROW}, [
              div({style: LABEL}, ["Dataset Name: "]),
              div([get(find(dataset.properties, p => {
                return p.propertyName === 'Dataset Name';
              }), 'propertyValue', '')])
            ])
          ]),
          div({style: SECTION_HEADER}, ["Dataset Information"]),
          div({style: {display: 'flex'}}, [
            div({style: DESCRIPTION_BOX}, [
              div({style: Styles.SMALL_BOLD}, ["Dataset Description:"]),
              LINE,
              div({style: {fontSize: Theme.font.size.small, padding: '1rem'}}, [
                get(find(dataset.properties, p => {
                  return p.propertyName === 'Description';
                }), 'propertyValue', '')
              ])
            ]),
            div([
              div({style: {display: 'flex'}}, [
                div({style: Styles.SMALL_BOLD}, ["Number of Participants: "]),
                div({style: Styles.SMALL_BOLD}, [
                  get(find(dataset.properties, p => {
                    return p.propertyName === '# of participants';
                  }), 'propertyValue', '')]),
              ]),
              div({style: {display: 'flex'}}, [
                div({style: Styles.SMALL_BOLD}, ["Principal Investigator: "]),
                div({style: Styles.SMALL_BOLD}, [
                  get(find(dataset.properties, p => {
                    return p.propertyName === 'Principal Investigator(PI)';
                  }), 'propertyValue', '')]),
              ]),
              div({style: {display: 'flex'}}, [
                div({style: Styles.SMALL_BOLD}, ["Data Custodian: "]),
                div({style: Styles.SMALL_BOLD}, [
                  get(find(dataset.properties, p => {
                    return p.propertyName === 'Data Depositor';
                  }), 'propertyValue', '')]),
              ])
            ])
          ]),
          div({style: SECTION_HEADER}, ["Summary of Research Findings to Date"]),
          div({style: {display: 'flex'}}, [
            div({style: BOX}, [
              div({style: {...Styles.SMALL_BOLD, textAlign: 'center'}}, ["Data Access Requests"]),
              LINE,
              div({style: JUMBO}, [dars.length])
            ]),
            div({style: DESCRIPTION_BOX}, [
              div({style: Styles.SMALL_BOLD}, ["DAR Project Titles:"]),
              LINE,
              div({style: {fontSize: Theme.font.size.small, padding: '1rem'}}, [
                dars.map((dar) => div({style: Styles.RECORD_ROW}, [dar.data.projectTitle]))
              ])
            ]),
            div({style: BOX}, [
              div({style: {...Styles.SMALL_BOLD, textAlign: 'center'}}, ["DARs Approved"]),
              LINE,
              div({style: JUMBO}, [darsApproved])
            ]),
            div({style: BOX}, [
              div({style: {...Styles.SMALL_BOLD, textAlign: 'center'}}, ["DARs Denied"]),
              LINE,
              div({style: JUMBO}, [darsDenied])
            ]),
          ]),
          div({style: SECTION_HEADER}, ["Data Access Requests - Research Statements"]),
          dars.map((dar) =>
            div({style: READ_MORE}, [
              ReadMore({
                props: props,
                readLessText: "Hide",
                readMoreText: "Show More",
                readStyle: { fontWeight: 500, margin: '0 20px'},
                content: [
                  div({style: {display: 'flex'}}, [
                    div({style: {...Styles.MEDIUM, margin: '15px 25px 5px 15px'}}, [dar.data.darCode]),
                    div({style: {...Styles.MEDIUM, margin: '15px 25px 5px 15px'}}, [dar.data.projectTitle])
                  ]),
                  LINE
                ],
                moreContent: [
                  div({style: {display: 'flex'}}, [
                    div({style: {display: 'flex'}}, [
                      div({style: Styles.SMALL_BOLD}, ["Principal Investigator: "]),
                      div({style: Styles.SMALL_BOLD}, [dar.data.investigator]),
                    ]),
                    div({style: {display: 'flex'}}, [
                      div({style: Styles.SMALL_BOLD}, ["Last Updated: "]),
                      div({style: Styles.SMALL_BOLD}, [dar.updateDate]),
                    ]),
                  ]),
                  div({style: Styles.SMALL_BOLD}, ["NonTechnical Summary:"]),
                  div({style: {fontSize: Theme.font.size.small, padding: '0 1rem 1rem 1rem'}}, [dar.data.nonTechRus])
                ]
              })
            ])
          )
        ]),
        h(DarTableSkeletonLoader, {isRendered: isLoading, tableHeaderTemplate, tableRowLoadingTemplate})
      ])
    );
  } else {
    return null;
  }
}