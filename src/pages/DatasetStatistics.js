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
  }, []);

  const setData = async (datasetId) => {
    try {
      setIsLoading(true);
      const metrics = await Metrics.getDatasetStats(datasetId);
      setDataset(metrics.dataset);
      setDars(metrics.dars);
      setElections(metrics.elections);
      setIsLoading(false);
    } catch(error) {
      Notifications.showError({text: 'Error: Unable to retrieve dataset statistics from server'});
      setIsLoading(false);
    }
  };

  return (
    div({style: Styles.PAGE}, [
      div({ style: {display: "flex", justifyContent: "space-between"}}, [
        div({className: "left-header-section", style: Styles.LEFT_HEADER_SECTION}, [
          div({style: Styles.HEADER_CONTAINER}, [
            div({style: Styles.TITLE}, ["Dataset Statistics"]),
            div({style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {fontSize: '18px'})}, ["Dataset Name"])
          ]),
        ]),
      ]),
      h(DarTableSkeletonLoader, {isRendered: isLoading, tableHeaderTemplate, tableRowLoadingTemplate})
    ])
  );
}