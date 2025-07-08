import React, { useState } from 'react';
import { FORM_TEXT_AREA_MAX_LENGTH } from 'src/components/forms/formConstants';
import {FormField, FormFieldTitle, FormFieldTypes} from 'src/components/forms/forms';
import { PublicationOrPresentation } from 'src/components/publications_list/PublicationOrPresentation';
import PublicationList from 'src/components/publications_list/PublicationList';
import {ValidFormState, FormState, FormStateKey} from 'src/pages/progress_reports/ProgressReportFormState';
import ERACommons from 'src/components/era_commons/ERACommons';
import {DuosUser} from 'src/types/model';
import {Location} from 'history';
import {DarErrors, ValidationError} from 'src/pages/dar_application/FormValidationState';
import {ERACommonsDisplay} from 'src/components/era_commons/ERACommonsDisplay';

interface SummarySectionProps {
    readonly readOnly: boolean;
    formState: FormState;
    onFormChange: (newState: Partial<FormState>) => void;
    readonly eRACommonsDestination?: string;
    readonly location?: Location;
    readonly researcher: DuosUser;
    onValidationChange?: (validationState: { key: string, validation: ValidationError }) => void;
    validation?: DarErrors;
    nihValid?: boolean;
    onNihStatusUpdate?: (valid: boolean) => void;
}

export default function SummarySection(props: SummarySectionProps): React.JSX.Element {
    const { readOnly, formState, onFormChange, eRACommonsDestination, location, researcher, onValidationChange, validation, nihValid, onNihStatusUpdate } = props;

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
                    <FormFieldTitle
                        id='researcherIdentificationTitle'
                        title='1.1 Researcher Identification'
                        validation={validation?.nihEraId}>
                    </FormFieldTitle>
                    {!readOnly ? (<ERACommons
                        destination={eRACommonsDestination}
                        researcherProfile={researcher}
                        nihValid={nihValid}
                        onNihStatusUpdate={onNihStatusUpdate}
                        location={location}
                        validationError={validation?.nihEraId}
                        header={true}
                        required={!readOnly} // In read-only mode, this is not required
                    />) : (<ERACommonsDisplay eraCommonsId={formState.eraCommonsId}/>)}
                </div>

                <div className='progress-report-row'>
                    <FormField
                        id={FormStateKey.PROGRESS_REPORT_SUMMARY}
                        type={FormFieldTypes.TEXTAREA}
                        title='1.2 Summary of Progress'
                        description='Please summarize your research on this project since your initial request or most recent renewal in the space below. Please describe whether and how the dataset(s) was used, including referencing the dataset(s) by name in your summary.'
                        placeholder='Please provide an update here.'
                        rows={6}
                        maxLength={FORM_TEXT_AREA_MAX_LENGTH}
                        defaultValue={formState.progressReportSummary}
                        onChange={({ key, value }: ValidFormState) => {
                            onFormChange({ [key]: value } as Partial<FormState>);
                        }}
                        disabled={readOnly}
                        validation={validation?.progressReportSummary}
                        onValidationChange={onValidationChange}
                    />
                </div>
                <div className='progress-report-row'>
                    <FormField
                        id={FormStateKey.INTELLECTUAL_PROPERTY_YES_NO}
                        type={FormFieldTypes.YESNORADIOGROUP}
                        title='1.3 Intellectual Property'
                        description={<span>Have you generated any <strong>intellectual property</strong> since your last renewal as a result of using the data?</span>}
                        orientation='horizontal'
                        defaultValue={formState.intellectualPropertyYesNo}
                        onChange={({ key, value }: ValidFormState) => {
                            onFormChange({ [key]: value } as Partial<FormState>);
                        }}
                        disabled={readOnly}
                        validation={validation?.intellectualPropertyYesNo}
                        onValidationChange={onValidationChange}
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
                        validation={validation?.intellectualPropertySummary}
                        onValidationChange={onValidationChange}
                    />}
                </div>
                <div className='progress-report-row'>
                    <FormField
                        id={FormStateKey.PUBLICATIONS_YES_NO}
                        type={FormFieldTypes.YESNORADIOGROUP}
                        title='1.4 Publications'
                        description={<span>Have you published in any <strong>publications</strong> since your last renewal as a result of using the data?</span>}
                        orientation='horizontal'
                        defaultValue={formState.publicationsYesNo}
                        onChange={({ key, value }: ValidFormState) => {
                            onFormChange({ [key]: value } as Partial<FormState>);
                        }}
                        disabled={readOnly}
                        validation={validation?.publicationsYesNo}
                        onValidationChange={onValidationChange}
                    />
                    {(formState.publicationsYesNo || (readOnly && publications.length > 0)) && <PublicationList
                        publications={publications}
                        publicationText='Publication'
                        columnsToShow={['title', 'date']}
                        onPublicationChange={onPublicationChange}
                        disabled={readOnly}
                        validation={validation}
                    />}
                </div>
                <div className='progress-report-row'>
                    <FormField
                        id={FormStateKey.PRESENTATIONS_YES_NO}
                        type={FormFieldTypes.YESNORADIOGROUP}
                        title='1.5 Presentations'
                        description={<span>Have you published in any <strong>presentations</strong> since your last renewal as a result of using the data?</span>}
                        orientation='horizontal'
                        defaultValue={formState.presentationsYesNo}
                        onChange={({ key, value }: ValidFormState) => {
                            onFormChange({ [key]: value } as Partial<FormState>);
                        }}
                        disabled={readOnly}
                        validation={validation?.presentationsYesNo}
                        onValidationChange={onValidationChange}
                    />
                    {(formState.presentationsYesNo || (readOnly && presentations.length > 0)) && <PublicationList
                        publications={presentations}
                        publicationText='Presentation'
                        columnsToShow={['title', 'date']}
                        onPublicationChange={onPresentationChange}
                        disabled={readOnly}
                        validation={validation}
                    />}
                </div>
            </div>
        </div>
    );
}
