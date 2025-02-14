import * as React from 'react';

interface OverflowTooltipProps {
  tooltipText: string;
  children: React.ReactNode | React.ReactNode[];
  id: string;
}
export const OverflowTooltip = (props: OverflowTooltipProps) => {
  const {id, tooltipText, children} = props;
  return <div
      data-for={id}
      style={{overflow: 'hidden', textOverflow: 'ellipsis'}}
    ><span title={tooltipText}>{children}</span></div>;
};
