import {div, h, span} from 'react-hyperscript-helpers';
import VoteResultIcon from './VoteResultIcon';
import {Fab, Fade, Link, useScrollTrigger} from "@mui/material";
import Box from "@mui/material/Box";
import {KeyboardArrowUp} from "@material-ui/icons";

const labelContainerStyle = {
  display: 'flex',
  padding: '4px 10px',
  backgroundColor: '#F3F5F8',
  textAlign: 'center',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '10%'
};

const labelFontStyle = {
  fontFamily: 'Montserrat',
  fontSize: '1.4rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  color: '#333'
};

//helper function to generate keys for rendered elements
const convertLabelToKey = (label) => {
  return label.split(' ').join('-');
};


function ScrollTop(props) {
  const { children } = props;
  const trigger = useScrollTrigger();

  const handleClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector(
      '#back-to-top-anchor',
    );

    if (anchor) {
      anchor.scrollIntoView({
        block: 'center',
      });
    }
  };

  return h(Fade, { in: trigger }, [
    h(Box, {
      onClick: handleClick,
      role: 'presentation',
      sx: {position: 'fixed', bottom: 16, right: 16}
    }, [children])
  ]);
}

export default function VoteResultBox({ label, votes, additionalLabelStyle = {} }) {
  const propKey = convertLabelToKey(label);
  return div(
    {
      style: Object.assign({}, labelContainerStyle, additionalLabelStyle),
      className: `vote-result-box-text-${propKey}`,
      key: `vote-result-box-${propKey}`,
      'data-tip': label,
      'data-for': 'vote-result'
    },
    [
      span({style: labelFontStyle}, [label]),
      h(VoteResultIcon, { propKey, votes }),
      h(ScrollTop, [h(Fab, {size: 'small', ariaLabel:'scroll to top'}, [
        h(KeyboardArrowUp)
      ])
      ])
    ]
  );
}