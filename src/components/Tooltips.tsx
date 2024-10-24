import ReactTooltip from 'react-tooltip';
import * as React from 'react';
import {useEffect, useRef, useState} from 'react';

// Copied from ReactTooltip Types
type Place = 'top' | 'right' | 'bottom' | 'left';

interface TooltipProps {
  tooltipText: string;
  children: React.ReactNode | React.ReactNode[];
  id: string;
  place: Place
}
export const OverflowTooltip = (props: TooltipProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isOverflown, setIsOverflown] = useState(false);
  useEffect(() => {
    const element = ref.current!;
    setIsOverflown(element.offsetWidth < element.scrollWidth);
  }, []);

  return <>
    <div
      data-tip='Full details'
      data-for={props.id}
      ref={ref}
      style={{overflow: 'hidden', textOverflow: 'ellipsis'}}
    >{props.children}</div>
    <ReactTooltip
      place={'top'}
      effect={'solid'}
      disable={!isOverflown}
      scrollHide={true}
      id={props.id}><div style={{maxWidth: '30vw', textWrap: 'wrap'}}>{props.tooltipText}</div></ReactTooltip>
  </>;
};
