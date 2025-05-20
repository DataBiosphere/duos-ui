import {needsDsAcknowledgement, needsGsoAcknowledgement, needsPubAcknowledgement} from 'src/utils/darFormUtils';
import {FormField, FormFieldTitle, FormFieldTypes} from 'src/components/forms/forms';
import React from 'react';
import {Dataset} from 'src/types/model';
import {DarErrors, ValidationError} from 'src/pages/dar_application/FormValidationState';

type DataUseAcknowledgementsProps = {
    title: string;
    datasets: Dataset[],
    dataUseTranslations: string[],
    formData: object,
    readOnlyMode: boolean,
    includeInstructions?: boolean,
    onChange: (object) => void,
    onValidationChange: (validation: {key: string, validation: ValidationError}) => void,
    validation?: DarErrors
}

export const DataUseAcknowledgements = ({
    title,
    datasets,
    dataUseTranslations,
    formData,
    readOnlyMode,
    includeInstructions = true,
    onChange,
    onValidationChange,
    validation
} : DataUseAcknowledgementsProps) => {

return (
    <div className='data-use-acknowledgements'>
        {
          (needsGsoAcknowledgement(datasets) || needsDsAcknowledgement(dataUseTranslations) || needsPubAcknowledgement(datasets)) &&
          <FormFieldTitle
              id={'dataUseAcknowledgements'}
              key={'dataUseAcknowledgements'}
              title={title}
              description={includeInstructions ? 'Please confirm listed acknowledgements and/or document requirements below:' : ''}
          />
        }
        {
            needsGsoAcknowledgement(datasets) &&
            <FormField
              id={'gsoAcknowledgement'}
              key={'gsoAcknowledgement'}
              disabled={readOnlyMode}
              type={FormFieldTypes.CHECKBOX}
              toggleText={'I acknowledge that I have selected a dataset limited to use on genetic studies only (GSO). I attest that I will respect this data use condition.'}
              defaultValue={formData.gsoAcknowledgement}
              onChange={onChange}
              validation={validation?.gsoAcknowledgement}
              onValidationChange={onValidationChange}
            />
        }

        {
            needsPubAcknowledgement(datasets) &&
            <FormField
              id={'pubAcknowledgement'}
              key={'pubAcknowledgement'}
              disabled={readOnlyMode}
              type={FormFieldTypes.CHECKBOX}
              toggleText={'I acknowledge that I have selected a dataset which requires results of studies using the data to be made available to the larger scientific community (PUB). I attest that I will respect this data use condition.'}
              defaultValue={formData.pubAcknowledgement}
              validation={validation?.pubAcknowledgement}
              onValidationChange={onValidationChange}
              onChange={onChange}
            />
        }

        {
            needsDsAcknowledgement(dataUseTranslations) &&
            <FormField
              id={'dsAcknowledgement'}
              key={'dsAcknowledgement'}
              disabled={readOnlyMode}
              type={FormFieldTypes.CHECKBOX}
              toggleText={'I acknowledge that the dataset can only be used in research consistent with the Data Use Limitations (DULs) and cannot be combined with other datasets of other phenotypes. Research uses inconsistent with DUL are considered a violation of the Data Use Certification agreement and any additional terms descried in the addendum'}
              defaultValue={formData.dsAcknowledgement}
              validation={validation?.dsAcknowledgement}
              onValidationChange={onValidationChange}
              onChange={onChange}
            />
        }
    </div>
);
};