import {h} from "react-hyperscript-helpers";
import SimpleButton from "../SimpleButton";
import {Theme} from "../../libs/theme";

export default function ResubmitCollectionButton(props) {
  const { collection } = props;
  return h(SimpleButton, {
    keyProp: `resubmit-collection-${collection.id}`,
    label: 'Revise',
    baseColor: Theme.palette.secondary,
    additionalStyle: {
      width: '30%',
      padding: '2%',
      fontSize: '1.45rem',
    },
    onClick: () => props.showConfirmationModal(collection)
  });
}