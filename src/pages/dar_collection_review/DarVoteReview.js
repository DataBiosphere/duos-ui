import DarCollectionReview from "./DarCollectionReview";
import {h} from "react-hyperscript-helpers";

export default function DarVoteReview(props) {
  return h(DarCollectionReview, {
    props,
    readOnly: true
  });
}