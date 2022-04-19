import {h, span} from "react-hyperscript-helpers";
import CollectionVoteButton from "./CollectionVoteButton";
import {CancelOutlined} from "@material-ui/icons";

export default function CollectionVoteNoButton(props) {
  const {onClick, disabled, isSelected} = props;

  const styles = {
    label: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    icon: {
      fontSize: '28px',
      margin: '2.5%'
    }
  };

  const Label = () => {
    return span({style: styles.label}, [
      h(CancelOutlined, {style: styles.icon}),
      'No'
    ]);
  };

  return h(CollectionVoteButton, {
    datacy: 'no-collection-vote-button',
    label: h(Label),
    onClick: () => onClick(),
    baseColor: '#DA0003',
    disabled,
    isSelected
  });
}
