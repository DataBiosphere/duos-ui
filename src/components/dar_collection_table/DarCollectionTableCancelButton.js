import {h} from "react-hyperscript-helpers";
import SimpleButton from "../SimpleButton";
import {includes} from "lodash/fp";
import {Theme} from "../../libs/theme";
import {darCollectionUtils} from "../../libs/utils";

const { determineCollectionStatus, nonCancellableCollectionStatuses } = darCollectionUtils;
export default function CancelCollectionButton(props) {
  const { collection } = props;
  return h(SimpleButton, {
    keyProp: `cancel-collection-${collection.id}`,
    label: 'Cancel',
    disabled: includes(determineCollectionStatus(collection))(nonCancellableCollectionStatuses),
    baseColor: Theme.palette.secondary,
    additionalStyle: {
      width: '30%',
      padding: '2%',
      fontSize: '1.45rem',
    },
    onClick: () => props.showConfirmationModal(collection)
  });
};