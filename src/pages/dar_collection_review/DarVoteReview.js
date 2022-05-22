import DarCollectionReview from "./DarCollectionReview";

export default function DarVoteReview(props) {
  const updatedProps = Object.assign({}, props, {readOnly: true});
  return DarCollectionReview(updatedProps);
}