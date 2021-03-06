import {useState, useEffect} from "react";
import {Metrics} from "../libs/ajax";
import {Notifications} from "../libs/utils";
import {div, a} from "react-hyperscript-helpers";
import {Styles, Theme} from "../libs/theme";
import {filter, map} from "lodash/fp";
import {get, find} from "lodash";
import {ReadMore} from "../components/ReadMore";
import {formatDate} from "../libs/utils";

const LINE = div({style: {borderTop: '1px solid #BABEC1', height: 0}}, []);

export default function DatasetStatistics(props) {
  const datasetId = props.match.params.datasetId;
  const [dataset, setDataset] = useState();
  const [dars, setDars] = useState();
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
      const approved = filter((election) => election.finalAccessVote === true)(metrics.elections);
      const denied = filter((election) => election.finalAccessVote === false)(metrics.elections);
      setDarsApproved(map((election) => election.referenceId)(approved));
      setDarsDenied(map((election) => election.referenceId)(denied));
      setIsLoading(false);
    } catch(error) {
      Notifications.showError({text: 'Error: Unable to retrieve dataset statistics from server'});
      setIsLoading(false);
    }
  };

  if (!isLoading) {
    return (
      div({style: {...Styles.PAGE, color: Theme.palette.primary}}, [
        div({style: {justifyContent: "space-between"}}, [
          div({style: {marginTop: '25px'}}, [
            div({style: Styles.TITLE}, ["Dataset Statistics"]),
            div({style: Styles.MEDIUM_ROW}, [
              div({style: {fontWeight: '500', marginRight: '5px'}}, ["Dataset ID: "]),
              div([dataset.alias])
            ]),
            div({style: Styles.MEDIUM_ROW}, [
              div({style: {fontWeight: '500', marginRight: '5px'}}, ["Dataset Name: "]),
              div([get(find(dataset.properties, p => {
                return p.propertyName === 'Dataset Name';
              }), 'propertyValue', '')])
            ])
          ]),
          div({style: Styles.SUB_HEADER}, ["Dataset Information"]),
          div({style: {display: 'flex'}}, [
            div({style: Styles.DESCRIPTION_BOX}, [
              div({style: {...Styles.MINOR_HEADER, paddingLeft:'10px'}}, ["Dataset Description:"]),
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
          div({style: Styles.SUB_HEADER}, ["Summary of Research Findings to Date"]),
          div({style: {display: 'flex'}}, [
            div({style: Styles.SQUARE_BOX}, [
              div({style: {...Styles.MINOR_HEADER, textAlign: 'center'}}, ["Data Access Requests"]),
              LINE,
              div({style: Styles.JUMBO}, [dars.length])
            ]),
            div({style: Styles.DESCRIPTION_BOX}, [
              div({style: {...Styles.MINOR_HEADER, paddingLeft:'10px'}}, ["DAR Project Titles:"]),
              LINE,
              div({style: {fontSize: Theme.font.size.small, padding: '1rem'}}, [
                dars.map((dar) => a({style: {display: 'block'}, href: `#${dar.darCode}`}, [dar.projectTitle]))
              ])
            ]),
            div({style: Styles.SQUARE_BOX}, [
              div({style: {...Styles.MINOR_HEADER, textAlign: 'center'}}, ["DARs Approved"]),
              LINE,
              div({style: Styles.JUMBO}, [darsApproved.length])
            ]),
            div({style: Styles.SQUARE_BOX}, [
              div({style: {...Styles.MINOR_HEADER, textAlign: 'center'}}, ["DARs Denied"]),
              LINE,
              div({style: Styles.JUMBO}, [darsDenied.length])
            ]),
          ]),
          div({style: Styles.SUB_HEADER}, ["Data Access Requests - Research Statements"]),
          dars.map((dar) =>
            div({style: Styles.READ_MORE, id: `${dar.darCode}` }, [
              ReadMore({
                props: props,
                readLessText: "Show less",
                readMoreText: "Show More",
                readStyle: { fontWeight: 500, margin: '20px', height: 0},
                content: [
                  div({style: {display: 'flex'}}, [
                    div({style: {...Styles.MEDIUM, width: "12%", margin: '15px'}}, [dar.darCode]),
                    div({style: {...Styles.MEDIUM, margin: '15px'}}, [dar.projectTitle])
                  ]),
                  LINE
                ],
                moreContent: [
                  div({style: {display: 'flex', backgroundColor: "white"}}, [
                    div({style: {display: 'flex', paddingRight: '2rem'}}, [
                      div({style: Styles.SMALL_BOLD}, ["Last Updated: "]),
                      div({style: Styles.SMALL_BOLD}, [formatDate(dar.updateDate)]),
                    ]),
                    (darsApproved.includes(dar.referenceId)) ?
                      div({style: {display: 'flex'}}, [
                        div({style: Styles.SMALL_BOLD}, ["Status: "]),
                        div({style: Styles.SMALL_BOLD}, ["APPROVED"]),
                      ])
                      : (darsDenied.includes(dar.referenceId)) ?
                        div({style: {display: 'flex'}}, [
                          div({style: Styles.SMALL_BOLD}, ["Status: "]),
                          div({style: Styles.SMALL_BOLD}, ["DENIED"]),
                        ])
                        : div()
                  ]),
                  div({style: {backgroundColor: "white"}}, [
                    div({style: Styles.SMALL_BOLD}, ["NonTechnical Summary:"]),
                    div({style: {fontSize: Theme.font.size.small, padding: '0 1rem 1rem 1rem'}}, [dar.nonTechRus])
                  ]),
                  LINE
                ]
              })
            ])
          )
        ])
      ])
    );
  } else {
    return null;
  }
}