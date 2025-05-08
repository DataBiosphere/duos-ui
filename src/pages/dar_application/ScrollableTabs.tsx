import React, {useCallback, useEffect, useState} from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

type ApplicationTab = {
    id: string,
    name: string,
    showStep?: boolean
};

type ScrollableTabsProps = {
    applicationTabs: ApplicationTab[],
    formSelectedTabId?: number
};

export const ScrollableTabs = ({ applicationTabs, formSelectedTabId }: ScrollableTabsProps) => {
    const [selectedStepNumber, setSelectedStepNumber] = useState<number>(1);

    const goToStep = useCallback((tabId) => {
        window.scrollTo({
            top: document.getElementById(tabId)?.offsetTop,
            behavior: 'smooth'
        });
    }, []);

    // CASE 1 - the form scrolls to a new tab based on validation errors
    useEffect(() => {
        if (formSelectedTabId !== undefined) {
            // setLocalSelectedStep(applicationTabs.findIndex(tab => tab.id === formSelectedTabId) + 1);
            setSelectedStepNumber(formSelectedTabId);
            goToStep(formSelectedTabId);
        }
    }, [goToStep, formSelectedTabId, applicationTabs]);

    // CASE 2 - the user scrolls on the page, so we auto-select a new tab
    // but, we don't adjust the scroll position
    const onScroll = () => {
        const scrollPos = window.scrollY;
        const scrollBuffer = window.innerHeight * .25;
        // Has to be recalculated based on whether accordions are open or not
        // So, we can't really use a callback
        const sectionIndex = applicationTabs
            .map((appTab) => document.getElementById(appTab.id)?.offsetTop)
            .findIndex(scrollTop => scrollTop > scrollPos + scrollBuffer);
        if (sectionIndex === 0) {
            setSelectedStepNumber(1);
        } else if (sectionIndex === -1) {
            setSelectedStepNumber(applicationTabs.length);
        } else {
            setSelectedStepNumber(sectionIndex);
        }
    };

    window.addEventListener('scroll', onScroll);

    return (
        <div className='multi-step-buttons-container'>
            <Tabs
                value={selectedStepNumber}
                variant='scrollable'
                scrollButtons='auto'
                orientation='vertical'
                TabIndicatorProps={{
                    style: {background: '#2BBD9B'}
                }}
                // CASE 3 - the user selects a new tab by clicking on it
                onChange={(_event, step) => {
                    setSelectedStepNumber(step);
                    goToStep(applicationTabs[step - 1].id);
                }}
            >
                {
                    applicationTabs.map((tabConfig, index) => {
                        const {name, showStep = true} = tabConfig;
                        return <Tab
                            key={`step-${index}-${name}`}
                            label={<div>
                                {showStep && <div className='step'>{`Step ${index + 1}`}</div>}
                                <div className='title'>{name}</div>
                            </div>}
                            value={index + 1}
                        />;
                    })
                }
            </Tabs>
        </div>
    )
};