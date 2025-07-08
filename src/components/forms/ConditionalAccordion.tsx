import {Accordion, AccordionDetails, AccordionSummary} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import React from 'react';

type ConditionalAccordionProps = {
    condition: boolean,
    title: string,
    defaultExpanded?: boolean,
    children: React.ReactNode
};
export const ConditionalAccordion = ({ condition, title, defaultExpanded=false, children }: ConditionalAccordionProps) => (
    condition ? (
        <Accordion
            sx={{ 'backgroundColor': '#b8cdd326', 'margin': '16px 0' }}
            defaultExpanded={defaultExpanded}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 40 }}/>}>
                <h3 style={{margin:'5px'}}>{title}</h3>
            </AccordionSummary>
            <AccordionDetails>
                {children}
            </AccordionDetails>
        </Accordion>) : (
            <div>
                <h2>{title}</h2>
                {children}
            </div>
    ));
