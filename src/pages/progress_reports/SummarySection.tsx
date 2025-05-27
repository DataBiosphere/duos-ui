import React, { useState } from 'react';
import { FORM_TEXT_AREA_MAX_LENGTH } from 'src/components/forms/formConstants';
import { FormField, FormFieldTypes } from 'src/components/forms/forms';
import { PublicationOrPresentation } from 'src/components/publications_list/PublicationOrPresentation';
import PublicationList from 'src/components/publications_list/PublicationList';
import {ValidFormState, FormState, FormStateKey} from "src/pages/progress_reports/ProgressReportFormState";
import ERACommons from 'src/components/ERACommons';
import {DuosUser} from 'src/types/model';
import {Location} from 'history';

interface SummarySectionProps {
    readonly readOnly: boolean;
    formState: FormState;
    onFormChange: (newState: Partial<FormState>) => void;
    readonly eRACommonsDestination?: string;
    readonly location?: Location;
    readonly researcher: DuosUser;
}

export default function SummarySection(props: SummarySectionProps): React.JSX.Element {
    const { readOnly, formState, onFormChange, eRACommonsDestination, location, researcher } = props;

    const [publications, setPublications] = useState<PublicationOrPresentation[]>(formState.publications || []);
    const [presentations, setPresentations] = useState<PublicationOrPresentation[]>(formState.presentations || []);

    const onStateChange = (key: string, setState: React.Dispatch<PublicationOrPresentation[]>, publications: PublicationOrPresentation[]) => {
        onFormChange({ [key]: publications } as Partial<FormState>);
        setState(publications);
    };
    const onPublicationChange = (publications: PublicationOrPresentation[]) => {
        onStateChange(FormStateKey.PUBLICATIONS, setPublications, publications);
    }

    const onPresentationChange = (presentations: PublicationOrPresentation[]) => {
        onStateChange(FormStateKey.PRESENTATIONS, setPresentations, presentations);
    }

    return (
        <div data-cy='summary-section'>
            <div className='progress-report-step-card'>
                {readOnly ? <h3>Review a Progress Report</h3> : <h3>Step 1: Submit a Progress Report</h3>}

                <div className='progress-report-row' data-cy='researcher-identification'>
                    <span className={'control-label'}>{'Researcher Identification'}</span>
                    <ERACommons
                        destination={eRACommonsDestination}
                        researcherProfile={researcher}
                        onNihStatusUpdate={() => {
                        }}
                        location={location}
                        validationError={() => {
                        }}
                        readOnly={readOnly}
                        header={true}
                        required={!readOnly} // In read-only mode, this is not required
                    />
                </div>

                <div className='progress-report-row'>
                    <FormField
                        id={FormStateKey.PROGRESS_REPORT_SUMMARY}
                        type={FormFieldTypes.TEXTAREA}
                        title='1.1 Summary of Progress'
                        description='Please summarize your research on this project since your initial request or most recent renewal in the space below. Please describe whether and how the dataset(s) was used, including referencing the dataset(s) by name in your summary.'
                        placeholder='Please provide an update here.'
                        rows={6}
                        maxLength={FORM_TEXT_AREA_MAX_LENGTH}
                        defaultValue={formState.progressReportSummary}
                        onChange={({ key, value }: ValidFormState) => {
                            onFormChange({ [key]: value } as Partial<FormState>);
                        }}
                        disabled={readOnly}
                    />
                </div>
                <div className='progress-report-row'>
                    <FormField
                        id={FormStateKey.INTELLECTUAL_PROPERTY_YES_NO}
                        type={FormFieldTypes.YESNORADIOGROUP}
                        title='1.2 Intellectual Property'
                        description={<span>Have you generated any <strong>intellectual property</strong> since your last renewal as a result of using the data?</span>}
                        orientation='horizontal'
                        defaultValue={formState.intellectualPropertyYesNo}
                        onChange={({ key, value }: ValidFormState) => {
                            onFormChange({ [key]: value } as Partial<FormState>);
                        }}
                        disabled={readOnly}
                    />
                    {formState.intellectualPropertyYesNo && <FormField
                        id={FormStateKey.INTELLECTUAL_PROPERTY_SUMMARY}
                        type={FormFieldTypes.TEXTAREA}
                        description='Please describe the intellectual property resulting from analysis of the requested dataset(s).'
                        placeholder='Please provide an update here.'
                        rows={6}
                        maxLength={FORM_TEXT_AREA_MAX_LENGTH}
                        defaultValue={formState.intellectualPropertySummary}
                        onChange={({ key, value }: ValidFormState) => {
                            onFormChange({ [key]: value } as Partial<FormState>);
                        }}
                        disabled={readOnly}
                    />}
                </div>
                <div className='progress-report-row'>
                    <FormField
                        id={FormStateKey.PUBLICATIONS_YES_NO}
                        type={FormFieldTypes.YESNORADIOGROUP}
                        title='1.3 Publications'
                        description={<span>Have you published in any <strong>publications</strong> since your last renewal as a result of using the data?</span>}
                        orientation='horizontal'
                        defaultValue={formState.publicationsYesNo}
                        onChange={({ key, value }: ValidFormState) => {
                            onFormChange({ [key]: value } as Partial<FormState>);
                        }}
                        disabled={readOnly}
                    />
                    {formState.publicationsYesNo && <PublicationList
                        publications={publications}
                        publicationText='Publication'
                        columnsToShow={['title', 'date']}
                        onPublicationChange={onPublicationChange}
                        disabled={readOnly}
                    />}
                </div>
                <div className='progress-report-row'>
                    <FormField
                        id={FormStateKey.PRESENTATIONS_YES_NO}
                        type={FormFieldTypes.YESNORADIOGROUP}
                        title='1.4 Presentations'
                        description={<span>Have you published in any <strong>presentations</strong> since your last renewal as a result of using the data?</span>}
                        orientation='horizontal'
                        defaultValue={formState.presentationsYesNo}
                        onChange={({ key, value }: ValidFormState) => {
                            onFormChange({ [key]: value } as Partial<FormState>);
                        }}
                        disabled={readOnly}
                    />
                    {formState.presentationsYesNo && <PublicationList
                        publications={presentations}
                        publicationText='Presentation'
                        columnsToShow={['title', 'date']}
                        onPublicationChange={onPresentationChange}
                        disabled={readOnly}
                    />}
                </div>
            </div>
        </div>
    );
}
