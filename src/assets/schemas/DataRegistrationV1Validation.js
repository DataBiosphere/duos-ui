/* eslint-disable */ "use strict";
module.exports = validate28;
module.exports.default = validate28;
const schema32 = { "$id": "https://consent.dsde-prod.broadinstitute.org/schemas/dataset-registration", "$schema": "https://json-schema.org/draft/2019-09/schema", "title": "Dataset Registration Schema", "version": 1, "type": "object", "required": ["studyName", "studyDescription", "dataTypes", "dataSubmitterUserId", "publicVisibility", "nihAnvilUse", "piName", "consentGroups"], "allOf": [{ "$comment": "require GSR explanation if the user selected yes", "if": { "required": ["controlledAccessRequiredForGenomicSummaryResultsGSR"], "properties": { "controlledAccessRequiredForGenomicSummaryResultsGSR": { "const": true } } }, "then": { "required": ["controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation"] } }, { "$comment": "include dbGaP related fields if they have one", "if": { "required": ["nihAnvilUse"], "properties": { "nihAnvilUse": { "type": "string", "enum": ["I am NHGRI funded and I have a dbGaP PHS ID already"] } } }, "then": { "$ref": "#/$defs/dbGaPInfo" } }, { "$comment": "include NIH related fields if using AnVil", "if": { "required": ["nihAnvilUse"], "properties": { "nihAnvilUse": { "type": "string", "enum": ["I am NHGRI funded and I have a dbGaP PHS ID already", "I am NHGRI funded and I do not have a dbGaP PHS ID", "I am not NHGRI funded but I am seeking to submit data to AnVIL"] } } }, "then": { "$ref": "#/$defs/nihAdministrativeInformation" } }, { "$comment": "require alternative data sharing plan fields if the DS needs one", "if": { "required": ["alternativeDataSharingPlan"], "properties": { "alternativeDataSharingPlan": { "const": true } } }, "then": { "required": ["alternativeDataSharingPlanExplanation", "alternativeDataSharingPlanReasons"], "properties": { "alternativeDataSharingPlanReasons": { "minItems": 1 } } } }], "properties": { "studyName": { "type": "string", "label": "Study Name", "description": "The study name", "minLength": 1 }, "studyType": { "type": "string", "enum": ["Observational", "Interventional", "Descriptive", "Analytical", "Prospective", "Retrospective", "Case report", "Case series", "Cross-sectional", "Cohort study"], "label": "Study Type", "description": "The study type" }, "studyDescription": { "type": "string", "label": "Study Description", "description": "Description of the study", "minLength": 1 }, "dataTypes": { "type": "array", "label": "Data Types", "description": "All data types that study encompasses", "items": { "type": "string" }, "minItems": 1 }, "phenotypeIndication": { "type": "string", "label": "Phenotype/Indication Studied", "description": "Phenotype/Indication Studied" }, "species": { "type": "string", "label": "Species", "description": "Species" }, "piName": { "type": "string", "label": "Principal Investigator Name", "description": "Principal Investigator Name", "minLength": 1 }, "dataSubmitterUserId": { "type": "integer", "label": "Data Submitter", "description": "The user creating the dataset submission" }, "dataCustodianEmail": { "type": "array", "label": "Data Custodian Email", "description": "Data Custodian Email", "items": { "type": "string", "format": "email" } }, "publicVisibility": { "type": "boolean", "label": "Public Visibility", "description": "Public Visibility of this study", "prompt": "Please select if you would like your dataset to be publicly visible for the requesters to see and select for an access request" }, "nihAnvilUse": { "type": "string", "enum": ["I am NHGRI funded and I have a dbGaP PHS ID already", "I am NHGRI funded and I do not have a dbGaP PHS ID", "I am not NHGRI funded but I am seeking to submit data to AnVIL", "I am not NHGRI funded and do not plan to store data in AnVIL"], "description": "NIH Anvil Use" }, "targetDeliveryDate": { "type": "string", "format": "date", "label": "Target Delivery Date", "description": "Target Delivery Date" }, "targetPublicReleaseDate": { "type": "string", "format": "date", "label": "Target Public Release Date", "description": "Target Public Release Date" }, "consentGroups": { "type": "array", "minItems": 1, "label": "Consent Groups", "description": "Consent Groups", "items": { "$ref": "#/$defs/consentGroup" } } }, "$defs": { "fileTypeObject": { "type": "object", "properties": { "fileType": { "type": "string", "description": "File Type", "enum": ["Arrays", "Genome", "Exome", "Survey", "Phenotype"] }, "functionalEquivalence": { "type": "string", "description": "Functional Equivalence" } } }, "dbGaPInfo": { "required": ["dbGaPPhsID"], "properties": { "dbGaPPhsID": { "type": "string", "label": "dbGaP phs ID", "description": "dbGaP phs ID", "minLength": 1 }, "dbGaPStudyRegistrationName": { "type": "string", "label": "dbGaP Study Registration Name", "description": "dbGaP Study Registration Name" }, "embargoReleaseDate": { "type": "string", "format": "date", "label": "Embargo Release Date", "description": "Embargo Release Date" }, "sequencingCenter": { "type": "string", "label": "Sequencing Center", "description": "Sequencing Center" } } }, "nihAdministrativeInformation": { "required": ["piInstitution", "nihGrantContractNumber"], "properties": { "piInstitution": { "type": "integer", "label": "Principal Investigator Institution", "description": "Principal Investigator Institution" }, "nihGrantContractNumber": { "type": "string", "label": "NIH Grant or Contract Number", "description": "NIH Grant or Contract Number", "minLength": 1 }, "nihICsSupportingStudy": { "type": "array", "label": "NIH ICs Supporting the Study", "description": "NIH ICs Supporting the Study", "items": { "type": "string", "enum": ["NCI", "NEI", "NHLBI", "NHGRI", "NIA", "NIAAA", "NIAID", "NIAMS", "NIBIB", "NICHD", "NIDCD", "NIDCR", "NIDDK", "NIDA", "NIEHS", "NIGMS", "NIMH", "NIMHD", "NINDS", "NINR", "NLM", "CC", "CIT", "CSR", "FIC", "NCATS", "NCCIH"] } }, "nihProgramOfficerName": { "type": "string", "label": "NIH Program Officer Name", "description": "NIH Program Officer Name" }, "nihInstitutionCenterSubmission": { "type": "string", "label": "NIH Institution/Center for Submission", "description": "NIH Institution/Center for Submission", "enum": ["NCI", "NEI", "NHLBI", "NHGRI", "NIA", "NIAAA", "NIAID", "NIAMS", "NIBIB", "NICHD", "NIDCD", "NIDCR", "NIDDK", "NIDA", "NIEHS", "NIGMS", "NIMH", "NIMHD", "NINDS", "NINR", "NLM", "CC", "CIT", "CSR", "FIC", "NCATS", "NCCIH"] }, "nihGenomicProgramAdministratorName": { "type": "string", "label": "NIH Genomic Program Administrator Name", "description": "NIH Genomic Program Administrator Name" }, "multiCenterStudy": { "type": "boolean", "label": "Is this a multi-center study?", "description": "Is this a multi-center study?" }, "collaboratingSites": { "type": "array", "label": "What are the collaborating sites?", "description": "What are the collaborating sites?", "items": { "type": "string" } }, "controlledAccessRequiredForGenomicSummaryResultsGSR": { "type": "boolean", "label": "Is controlled access required for genomic summary results (GSR)?", "description": "Is controlled access required for genomic summary results (GSR)?" }, "controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation": { "type": "string", "label": "If yes, explain why controlled access is required for GSR", "description": "If yes, explain why controlled access is required for GSR", "minLength": 1 }, "alternativeDataSharingPlan": { "type": "boolean", "label": "Are you requesting an Alternative Data Sharing Plan for samples that cannot be shared through a public repository or database?", "description": "Are you requesting an Alternative Data Sharing Plan for samples that cannot be shared through a public repository or database?" }, "alternativeDataSharingPlanReasons": { "type": "array", "label": "Please mark the reasons for which you are requesting an Alternative Data Sharing Plan (check all that apply)", "description": "Please mark the reasons for which you are requesting an Alternative Data Sharing Plan (check all that apply)", "items": { "type": "string", "enum": ["Legal Restrictions", "Informed consent processes are inadequate to support data for sharing for the following reasons:", "The consent forms are unavailable or non-existent for samples collected after January 25, 2015", "The consent process did not specifically address future use or broad data sharing for samples collected after January 25, 2015", "The consent process inadequately addresses risks related to future use or broad data sharing for samples collected after January 25, 2015", "The consent process specifically precludes future use or broad data sharing (including a statement that use of data will be limited to the original researchers)", "Other informed consent limitations or concerns", "Other"] } }, "alternativeDataSharingPlanExplanation": { "type": "string", "label": "Explanation of Request", "description": "Explanation of Request" }, "alternativeDataSharingPlanFileName": { "type": "string", "label": "Upload your alternative sharing plan (file upload)", "description": "Upload your alternative sharing plan (file upload)" }, "alternativeDataSharingPlanDataSubmitted": { "type": "string", "label": "Data will be submitted", "description": "Upload your alternative sharing plan (file upload)", "enum": ["Within 3 months of the last data generated or last clinical visit", "By batches over Study Timeline (e.g. based on clinical trial enrollment benchmarks)"] }, "alternativeDataSharingPlanDataReleased": { "type": "boolean", "label": "Data to be released will meet the timeframes specified in the NHGRI Guidance for Data Submission and Data Release", "description": "Data to be released will meet the timeframes specified in the NHGRI Guidance for Data Submission and Data Release" }, "alternativeDataSharingPlanTargetDeliveryDate": { "type": "string", "format": "date", "label": "Target Delivery Date", "description": "Target Delivery Date" }, "alternativeDataSharingPlanControlledOpenAccess": { "type": "string", "label": "Does the data need to be managed under Controlled or Open Access?", "description": "Does the data need to be managed under Controlled or Open Access?", "enum": ["Controlled Access", "Open Access"] } } }, "consentGroup": { "type": "object", "required": ["consentGroupName", "fileTypes", "numberOfParticipants"], "allOf": [{ "if": { "properties": { "dataLocation": { "const": "Not Determined" } } }, "then": {}, "else": { "required": ["url"] } }, { "$comment": "if openAccess is false OR not present, then require dac id & add secondary consent fields", "if": { "properties": { "openAccess": { "const": false } } }, "then": { "required": ["dataAccessCommitteeId"], "properties": { "nmds": { "type": "boolean", "label": "No Methods Development or validation studies (NMDS)", "description": "No Methods Development or validation studies (NMDS)" }, "gso": { "type": "boolean", "label": "Genetic studies only (GSO)", "description": "Genetic studies only (GSO)" }, "pub": { "type": "boolean", "label": "Publication Required (PUB)", "description": "Publication Required (PUB)" }, "col": { "type": "boolean", "label": "Collaboration Required (COL)", "description": "Collaboration Required (COL)" }, "irb": { "type": "boolean", "label": "Ethics Approval Required (IRB)", "description": "Ethics Approval Required (IRB)" }, "gs": { "type": "string", "label": "Geographic Restriction (GS-)", "description": "Geographic Restriction (GS-)" }, "mor": { "type": "boolean", "label": "Publication Moratorium (MOR)", "description": "Publication Moratorium (MOR)" }, "morDate": { "type": "string", "format": "date", "label": "Publication Moratorium Date (MOR)", "description": "Publication Moratorium Date (MOR)" }, "npu": { "type": "boolean", "label": "Non-profit Use Only (NPU)", "description": "Non-profit Use Only (NPU)" }, "otherSecondary": { "type": "string", "label": "Other", "description": "Other" }, "dataAccessCommitteeId": { "type": "integer", "label": "Please select which DAC should govern requests for this dataset", "description": "Data Access Committee ID" } } } }, { "$comment": "ensure one (and only one) primary consent is selected", "oneOf": [{ "properties": { "openAccess": { "const": true } }, "required": ["openAccess"] }, { "properties": { "generalResearchUse": { "const": true } }, "required": ["generalResearchUse"] }, { "properties": { "hmb": { "const": true } }, "required": ["hmb"] }, { "properties": { "poa": { "const": true } }, "required": ["poa"] }, { "properties": { "diseaseSpecificUse": { "minItems": 1 } }, "required": ["diseaseSpecificUse"] }, { "properties": { "otherPrimary": { "minLength": 1 } }, "required": ["otherPrimary"] }] }], "properties": { "datasetId": { "type": "integer", "description": "Dataset Id" }, "consentGroupName": { "type": "string", "label": "Consent Group Name", "description": "Consent Group Name", "minLength": 1 }, "openAccess": { "type": "boolean", "label": "No Restrictions", "description": "No Restrictions" }, "generalResearchUse": { "type": "boolean", "label": "General Research Use", "description": "General Research Use" }, "hmb": { "type": "boolean", "label": "Health/Medical/Biomedical Research Use", "description": "Health/Medical/Biomedical Research Use" }, "diseaseSpecificUse": { "type": "array", "label": "Disease-Specific Research Use", "description": "Disease-Specific Research Use", "items": { "type": "string" } }, "poa": { "type": "boolean", "label": "Populations, Origins, Ancestry Use", "description": "Populations, Origins, Ancestry Use" }, "otherPrimary": { "type": "string", "label": "Other", "description": "Other" }, "dataLocation": { "type": "string", "enum": ["AnVIL Workspace", "Terra Workspace", "TDR Location", "Not Determined"], "label": "Please provide the location of your data resource for this consent group", "description": "Data Location" }, "url": { "type": "string", "format": "uri", "label": "Free text field for entering URL of data", "description": "Free text field for entering URL of data", "minLength": 1 }, "numberOfParticipants": { "type": "integer", "description": "# of Participants" }, "fileTypes": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/fileTypeObject" }, "description": "List of File Types" } } } } };
const schema33 = { "required": ["dbGaPPhsID"], "properties": { "dbGaPPhsID": { "type": "string", "label": "dbGaP phs ID", "description": "dbGaP phs ID", "minLength": 1 }, "dbGaPStudyRegistrationName": { "type": "string", "label": "dbGaP Study Registration Name", "description": "dbGaP Study Registration Name" }, "embargoReleaseDate": { "type": "string", "format": "date", "label": "Embargo Release Date", "description": "Embargo Release Date" }, "sequencingCenter": { "type": "string", "label": "Sequencing Center", "description": "Sequencing Center" } } };
const schema34 = { "required": ["piInstitution", "nihGrantContractNumber"], "properties": { "piInstitution": { "type": "integer", "label": "Principal Investigator Institution", "description": "Principal Investigator Institution" }, "nihGrantContractNumber": { "type": "string", "label": "NIH Grant or Contract Number", "description": "NIH Grant or Contract Number", "minLength": 1 }, "nihICsSupportingStudy": { "type": "array", "label": "NIH ICs Supporting the Study", "description": "NIH ICs Supporting the Study", "items": { "type": "string", "enum": ["NCI", "NEI", "NHLBI", "NHGRI", "NIA", "NIAAA", "NIAID", "NIAMS", "NIBIB", "NICHD", "NIDCD", "NIDCR", "NIDDK", "NIDA", "NIEHS", "NIGMS", "NIMH", "NIMHD", "NINDS", "NINR", "NLM", "CC", "CIT", "CSR", "FIC", "NCATS", "NCCIH"] } }, "nihProgramOfficerName": { "type": "string", "label": "NIH Program Officer Name", "description": "NIH Program Officer Name" }, "nihInstitutionCenterSubmission": { "type": "string", "label": "NIH Institution/Center for Submission", "description": "NIH Institution/Center for Submission", "enum": ["NCI", "NEI", "NHLBI", "NHGRI", "NIA", "NIAAA", "NIAID", "NIAMS", "NIBIB", "NICHD", "NIDCD", "NIDCR", "NIDDK", "NIDA", "NIEHS", "NIGMS", "NIMH", "NIMHD", "NINDS", "NINR", "NLM", "CC", "CIT", "CSR", "FIC", "NCATS", "NCCIH"] }, "nihGenomicProgramAdministratorName": { "type": "string", "label": "NIH Genomic Program Administrator Name", "description": "NIH Genomic Program Administrator Name" }, "multiCenterStudy": { "type": "boolean", "label": "Is this a multi-center study?", "description": "Is this a multi-center study?" }, "collaboratingSites": { "type": "array", "label": "What are the collaborating sites?", "description": "What are the collaborating sites?", "items": { "type": "string" } }, "controlledAccessRequiredForGenomicSummaryResultsGSR": { "type": "boolean", "label": "Is controlled access required for genomic summary results (GSR)?", "description": "Is controlled access required for genomic summary results (GSR)?" }, "controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation": { "type": "string", "label": "If yes, explain why controlled access is required for GSR", "description": "If yes, explain why controlled access is required for GSR", "minLength": 1 }, "alternativeDataSharingPlan": { "type": "boolean", "label": "Are you requesting an Alternative Data Sharing Plan for samples that cannot be shared through a public repository or database?", "description": "Are you requesting an Alternative Data Sharing Plan for samples that cannot be shared through a public repository or database?" }, "alternativeDataSharingPlanReasons": { "type": "array", "label": "Please mark the reasons for which you are requesting an Alternative Data Sharing Plan (check all that apply)", "description": "Please mark the reasons for which you are requesting an Alternative Data Sharing Plan (check all that apply)", "items": { "type": "string", "enum": ["Legal Restrictions", "Informed consent processes are inadequate to support data for sharing for the following reasons:", "The consent forms are unavailable or non-existent for samples collected after January 25, 2015", "The consent process did not specifically address future use or broad data sharing for samples collected after January 25, 2015", "The consent process inadequately addresses risks related to future use or broad data sharing for samples collected after January 25, 2015", "The consent process specifically precludes future use or broad data sharing (including a statement that use of data will be limited to the original researchers)", "Other informed consent limitations or concerns", "Other"] } }, "alternativeDataSharingPlanExplanation": { "type": "string", "label": "Explanation of Request", "description": "Explanation of Request" }, "alternativeDataSharingPlanFileName": { "type": "string", "label": "Upload your alternative sharing plan (file upload)", "description": "Upload your alternative sharing plan (file upload)" }, "alternativeDataSharingPlanDataSubmitted": { "type": "string", "label": "Data will be submitted", "description": "Upload your alternative sharing plan (file upload)", "enum": ["Within 3 months of the last data generated or last clinical visit", "By batches over Study Timeline (e.g. based on clinical trial enrollment benchmarks)"] }, "alternativeDataSharingPlanDataReleased": { "type": "boolean", "label": "Data to be released will meet the timeframes specified in the NHGRI Guidance for Data Submission and Data Release", "description": "Data to be released will meet the timeframes specified in the NHGRI Guidance for Data Submission and Data Release" }, "alternativeDataSharingPlanTargetDeliveryDate": { "type": "string", "format": "date", "label": "Target Delivery Date", "description": "Target Delivery Date" }, "alternativeDataSharingPlanControlledOpenAccess": { "type": "string", "label": "Does the data need to be managed under Controlled or Open Access?", "description": "Does the data need to be managed under Controlled or Open Access?", "enum": ["Controlled Access", "Open Access"] } } };
const func3 = require("ajv/dist/runtime/ucs2length").default;
const formats0 = { "_items": ["require(\"ajv-formats/dist/formats\").", { "str": "fullFormats" }, ""] }.date;
const formats4 = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
const schema35 = { "type": "object", "required": ["consentGroupName", "fileTypes", "numberOfParticipants"], "allOf": [{ "if": { "properties": { "dataLocation": { "const": "Not Determined" } } }, "then": {}, "else": { "required": ["url"] } }, { "$comment": "if openAccess is false OR not present, then require dac id & add secondary consent fields", "if": { "properties": { "openAccess": { "const": false } } }, "then": { "required": ["dataAccessCommitteeId"], "properties": { "nmds": { "type": "boolean", "label": "No Methods Development or validation studies (NMDS)", "description": "No Methods Development or validation studies (NMDS)" }, "gso": { "type": "boolean", "label": "Genetic studies only (GSO)", "description": "Genetic studies only (GSO)" }, "pub": { "type": "boolean", "label": "Publication Required (PUB)", "description": "Publication Required (PUB)" }, "col": { "type": "boolean", "label": "Collaboration Required (COL)", "description": "Collaboration Required (COL)" }, "irb": { "type": "boolean", "label": "Ethics Approval Required (IRB)", "description": "Ethics Approval Required (IRB)" }, "gs": { "type": "string", "label": "Geographic Restriction (GS-)", "description": "Geographic Restriction (GS-)" }, "mor": { "type": "boolean", "label": "Publication Moratorium (MOR)", "description": "Publication Moratorium (MOR)" }, "morDate": { "type": "string", "format": "date", "label": "Publication Moratorium Date (MOR)", "description": "Publication Moratorium Date (MOR)" }, "npu": { "type": "boolean", "label": "Non-profit Use Only (NPU)", "description": "Non-profit Use Only (NPU)" }, "otherSecondary": { "type": "string", "label": "Other", "description": "Other" }, "dataAccessCommitteeId": { "type": "integer", "label": "Please select which DAC should govern requests for this dataset", "description": "Data Access Committee ID" } } } }, { "$comment": "ensure one (and only one) primary consent is selected", "oneOf": [{ "properties": { "openAccess": { "const": true } }, "required": ["openAccess"] }, { "properties": { "generalResearchUse": { "const": true } }, "required": ["generalResearchUse"] }, { "properties": { "hmb": { "const": true } }, "required": ["hmb"] }, { "properties": { "poa": { "const": true } }, "required": ["poa"] }, { "properties": { "diseaseSpecificUse": { "minItems": 1 } }, "required": ["diseaseSpecificUse"] }, { "properties": { "otherPrimary": { "minLength": 1 } }, "required": ["otherPrimary"] }] }], "properties": { "datasetId": { "type": "integer", "description": "Dataset Id" }, "consentGroupName": { "type": "string", "label": "Consent Group Name", "description": "Consent Group Name", "minLength": 1 }, "openAccess": { "type": "boolean", "label": "No Restrictions", "description": "No Restrictions" }, "generalResearchUse": { "type": "boolean", "label": "General Research Use", "description": "General Research Use" }, "hmb": { "type": "boolean", "label": "Health/Medical/Biomedical Research Use", "description": "Health/Medical/Biomedical Research Use" }, "diseaseSpecificUse": { "type": "array", "label": "Disease-Specific Research Use", "description": "Disease-Specific Research Use", "items": { "type": "string" } }, "poa": { "type": "boolean", "label": "Populations, Origins, Ancestry Use", "description": "Populations, Origins, Ancestry Use" }, "otherPrimary": { "type": "string", "label": "Other", "description": "Other" }, "dataLocation": { "type": "string", "enum": ["AnVIL Workspace", "Terra Workspace", "TDR Location", "Not Determined"], "label": "Please provide the location of your data resource for this consent group", "description": "Data Location" }, "url": { "type": "string", "format": "uri", "label": "Free text field for entering URL of data", "description": "Free text field for entering URL of data", "minLength": 1 }, "numberOfParticipants": { "type": "integer", "description": "# of Participants" }, "fileTypes": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/fileTypeObject" }, "description": "List of File Types" } } };
const schema36 = { "type": "object", "properties": { "fileType": { "type": "string", "description": "File Type", "enum": ["Arrays", "Genome", "Exome", "Survey", "Phenotype"] }, "functionalEquivalence": { "type": "string", "description": "Functional Equivalence" } } };
const formats12 = { "_items": ["require(\"ajv-formats/dist/formats\").", { "str": "fullFormats" }, ""] }.uri;

function validate29(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate29.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  const _errs2 = errors;
  let valid1 = true;
  const _errs3 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.dataLocation !== undefined) {
      if ("Not Determined" !== data.dataLocation) {
        const err0 = {};
        if (vErrors === null) {
          vErrors = [err0];
        }
        else {
          vErrors.push(err0);
        }
        errors++;
      }
    }
  }
  var _valid0 = _errs3 === errors;
  errors = _errs2;
  if (vErrors !== null) {
    if (_errs2) {
      vErrors.length = _errs2;
    }
    else {
      vErrors = null;
    }
  }
  if (!_valid0) {
    const _errs5 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.url === undefined) {
        const err1 = { instancePath, schemaPath: "#/allOf/0/else/required", keyword: "required", params: { missingProperty: "url" }, message: "must have required property '" + "url" + "'" };
        if (vErrors === null) {
          vErrors = [err1];
        }
        else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
    var _valid0 = _errs5 === errors;
    valid1 = _valid0;
  }
  if (!valid1) {
    const err2 = { instancePath, schemaPath: "#/allOf/0/if", keyword: "if", params: { failingKeyword: "else" }, message: "must match \"else\" schema" };
    if (vErrors === null) {
      vErrors = [err2];
    }
    else {
      vErrors.push(err2);
    }
    errors++;
  }
  const _errs8 = errors;
  let valid3 = true;
  const _errs9 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.openAccess !== undefined) {
      if (false !== data.openAccess) {
        const err3 = {};
        if (vErrors === null) {
          vErrors = [err3];
        }
        else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
  }
  var _valid1 = _errs9 === errors;
  errors = _errs8;
  if (vErrors !== null) {
    if (_errs8) {
      vErrors.length = _errs8;
    }
    else {
      vErrors = null;
    }
  }
  if (_valid1) {
    const _errs11 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.dataAccessCommitteeId === undefined) {
        const err4 = { instancePath, schemaPath: "#/allOf/1/then/required", keyword: "required", params: { missingProperty: "dataAccessCommitteeId" }, message: "must have required property '" + "dataAccessCommitteeId" + "'" };
        if (vErrors === null) {
          vErrors = [err4];
        }
        else {
          vErrors.push(err4);
        }
        errors++;
      }
      if (data.nmds !== undefined) {
        if (typeof data.nmds !== "boolean") {
          const err5 = { instancePath: instancePath + "/nmds", schemaPath: "#/allOf/1/then/properties/nmds/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
          if (vErrors === null) {
            vErrors = [err5];
          }
          else {
            vErrors.push(err5);
          }
          errors++;
        }
      }
      if (data.gso !== undefined) {
        if (typeof data.gso !== "boolean") {
          const err6 = { instancePath: instancePath + "/gso", schemaPath: "#/allOf/1/then/properties/gso/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
          if (vErrors === null) {
            vErrors = [err6];
          }
          else {
            vErrors.push(err6);
          }
          errors++;
        }
      }
      if (data.pub !== undefined) {
        if (typeof data.pub !== "boolean") {
          const err7 = { instancePath: instancePath + "/pub", schemaPath: "#/allOf/1/then/properties/pub/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
          if (vErrors === null) {
            vErrors = [err7];
          }
          else {
            vErrors.push(err7);
          }
          errors++;
        }
      }
      if (data.col !== undefined) {
        if (typeof data.col !== "boolean") {
          const err8 = { instancePath: instancePath + "/col", schemaPath: "#/allOf/1/then/properties/col/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
          if (vErrors === null) {
            vErrors = [err8];
          }
          else {
            vErrors.push(err8);
          }
          errors++;
        }
      }
      if (data.irb !== undefined) {
        if (typeof data.irb !== "boolean") {
          const err9 = { instancePath: instancePath + "/irb", schemaPath: "#/allOf/1/then/properties/irb/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
          if (vErrors === null) {
            vErrors = [err9];
          }
          else {
            vErrors.push(err9);
          }
          errors++;
        }
      }
      if (data.gs !== undefined) {
        if (typeof data.gs !== "string") {
          const err10 = { instancePath: instancePath + "/gs", schemaPath: "#/allOf/1/then/properties/gs/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err10];
          }
          else {
            vErrors.push(err10);
          }
          errors++;
        }
      }
      if (data.mor !== undefined) {
        if (typeof data.mor !== "boolean") {
          const err11 = { instancePath: instancePath + "/mor", schemaPath: "#/allOf/1/then/properties/mor/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
          if (vErrors === null) {
            vErrors = [err11];
          }
          else {
            vErrors.push(err11);
          }
          errors++;
        }
      }
      if (data.morDate !== undefined) {
        let data9 = data.morDate;
        if (typeof data9 === "string") {
          if (!(formats0.validate(data9))) {
            const err12 = { instancePath: instancePath + "/morDate", schemaPath: "#/allOf/1/then/properties/morDate/format", keyword: "format", params: { format: "date" }, message: "must match format \"" + "date" + "\"" };
            if (vErrors === null) {
              vErrors = [err12];
            }
            else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
        else {
          const err13 = { instancePath: instancePath + "/morDate", schemaPath: "#/allOf/1/then/properties/morDate/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err13];
          }
          else {
            vErrors.push(err13);
          }
          errors++;
        }
      }
      if (data.npu !== undefined) {
        if (typeof data.npu !== "boolean") {
          const err14 = { instancePath: instancePath + "/npu", schemaPath: "#/allOf/1/then/properties/npu/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
          if (vErrors === null) {
            vErrors = [err14];
          }
          else {
            vErrors.push(err14);
          }
          errors++;
        }
      }
      if (data.otherSecondary !== undefined) {
        if (typeof data.otherSecondary !== "string") {
          const err15 = { instancePath: instancePath + "/otherSecondary", schemaPath: "#/allOf/1/then/properties/otherSecondary/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err15];
          }
          else {
            vErrors.push(err15);
          }
          errors++;
        }
      }
      if (data.dataAccessCommitteeId !== undefined) {
        let data12 = data.dataAccessCommitteeId;
        if (!((typeof data12 == "number") && (!(data12 % 1) && !isNaN(data12)))) {
          const err16 = { instancePath: instancePath + "/dataAccessCommitteeId", schemaPath: "#/allOf/1/then/properties/dataAccessCommitteeId/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
          if (vErrors === null) {
            vErrors = [err16];
          }
          else {
            vErrors.push(err16);
          }
          errors++;
        }
      }
    }
    var _valid1 = _errs11 === errors;
    valid3 = _valid1;
    if (valid3) {
      var props0 = {};
      props0.nmds = true;
      props0.gso = true;
      props0.pub = true;
      props0.col = true;
      props0.irb = true;
      props0.gs = true;
      props0.mor = true;
      props0.morDate = true;
      props0.npu = true;
      props0.otherSecondary = true;
      props0.dataAccessCommitteeId = true;
      props0.openAccess = true;
    }
  }
  if (!valid3) {
    const err17 = { instancePath, schemaPath: "#/allOf/1/if", keyword: "if", params: { failingKeyword: "then" }, message: "must match \"then\" schema" };
    if (vErrors === null) {
      vErrors = [err17];
    }
    else {
      vErrors.push(err17);
    }
    errors++;
  }
  if (props0 !== true) {
    props0 = props0 || {};
    props0.dataLocation = true;
  }
  const _errs36 = errors;
  let valid6 = false;
  let passing0 = null;
  const _errs37 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.openAccess === undefined) {
      const err18 = { instancePath, schemaPath: "#/allOf/2/oneOf/0/required", keyword: "required", params: { missingProperty: "openAccess" }, message: "must have required property '" + "openAccess" + "'" };
      if (vErrors === null) {
        vErrors = [err18];
      }
      else {
        vErrors.push(err18);
      }
      errors++;
    }
    if (data.openAccess !== undefined) {
      if (true !== data.openAccess) {
        const err19 = { instancePath: instancePath + "/openAccess", schemaPath: "#/allOf/2/oneOf/0/properties/openAccess/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err19];
        }
        else {
          vErrors.push(err19);
        }
        errors++;
      }
    }
  }
  var _valid2 = _errs37 === errors;
  if (_valid2) {
    valid6 = true;
    passing0 = 0;
    var props1 = {};
    props1.openAccess = true;
  }
  const _errs39 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.generalResearchUse === undefined) {
      const err20 = { instancePath, schemaPath: "#/allOf/2/oneOf/1/required", keyword: "required", params: { missingProperty: "generalResearchUse" }, message: "must have required property '" + "generalResearchUse" + "'" };
      if (vErrors === null) {
        vErrors = [err20];
      }
      else {
        vErrors.push(err20);
      }
      errors++;
    }
    if (data.generalResearchUse !== undefined) {
      if (true !== data.generalResearchUse) {
        const err21 = { instancePath: instancePath + "/generalResearchUse", schemaPath: "#/allOf/2/oneOf/1/properties/generalResearchUse/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err21];
        }
        else {
          vErrors.push(err21);
        }
        errors++;
      }
    }
  }
  var _valid2 = _errs39 === errors;
  if (_valid2 && valid6) {
    valid6 = false;
    passing0 = [passing0, 1];
  }
  else {
    if (_valid2) {
      valid6 = true;
      passing0 = 1;
      if (props1 !== true) {
        props1 = props1 || {};
        props1.generalResearchUse = true;
      }
    }
    const _errs41 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.hmb === undefined) {
        const err22 = { instancePath, schemaPath: "#/allOf/2/oneOf/2/required", keyword: "required", params: { missingProperty: "hmb" }, message: "must have required property '" + "hmb" + "'" };
        if (vErrors === null) {
          vErrors = [err22];
        }
        else {
          vErrors.push(err22);
        }
        errors++;
      }
      if (data.hmb !== undefined) {
        if (true !== data.hmb) {
          const err23 = { instancePath: instancePath + "/hmb", schemaPath: "#/allOf/2/oneOf/2/properties/hmb/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" };
          if (vErrors === null) {
            vErrors = [err23];
          }
          else {
            vErrors.push(err23);
          }
          errors++;
        }
      }
    }
    var _valid2 = _errs41 === errors;
    if (_valid2 && valid6) {
      valid6 = false;
      passing0 = [passing0, 2];
    }
    else {
      if (_valid2) {
        valid6 = true;
        passing0 = 2;
        if (props1 !== true) {
          props1 = props1 || {};
          props1.hmb = true;
        }
      }
      const _errs43 = errors;
      if (data && typeof data == "object" && !Array.isArray(data)) {
        if (data.poa === undefined) {
          const err24 = { instancePath, schemaPath: "#/allOf/2/oneOf/3/required", keyword: "required", params: { missingProperty: "poa" }, message: "must have required property '" + "poa" + "'" };
          if (vErrors === null) {
            vErrors = [err24];
          }
          else {
            vErrors.push(err24);
          }
          errors++;
        }
        if (data.poa !== undefined) {
          if (true !== data.poa) {
            const err25 = { instancePath: instancePath + "/poa", schemaPath: "#/allOf/2/oneOf/3/properties/poa/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" };
            if (vErrors === null) {
              vErrors = [err25];
            }
            else {
              vErrors.push(err25);
            }
            errors++;
          }
        }
      }
      var _valid2 = _errs43 === errors;
      if (_valid2 && valid6) {
        valid6 = false;
        passing0 = [passing0, 3];
      }
      else {
        if (_valid2) {
          valid6 = true;
          passing0 = 3;
          if (props1 !== true) {
            props1 = props1 || {};
            props1.poa = true;
          }
        }
        const _errs45 = errors;
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.diseaseSpecificUse === undefined) {
            const err26 = { instancePath, schemaPath: "#/allOf/2/oneOf/4/required", keyword: "required", params: { missingProperty: "diseaseSpecificUse" }, message: "must have required property '" + "diseaseSpecificUse" + "'" };
            if (vErrors === null) {
              vErrors = [err26];
            }
            else {
              vErrors.push(err26);
            }
            errors++;
          }
          if (data.diseaseSpecificUse !== undefined) {
            let data17 = data.diseaseSpecificUse;
            if (Array.isArray(data17)) {
              if (data17.length < 1) {
                const err27 = { instancePath: instancePath + "/diseaseSpecificUse", schemaPath: "#/allOf/2/oneOf/4/properties/diseaseSpecificUse/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
                if (vErrors === null) {
                  vErrors = [err27];
                }
                else {
                  vErrors.push(err27);
                }
                errors++;
              }
            }
          }
        }
        var _valid2 = _errs45 === errors;
        if (_valid2 && valid6) {
          valid6 = false;
          passing0 = [passing0, 4];
        }
        else {
          if (_valid2) {
            valid6 = true;
            passing0 = 4;
            if (props1 !== true) {
              props1 = props1 || {};
              props1.diseaseSpecificUse = true;
            }
          }
          const _errs47 = errors;
          if (data && typeof data == "object" && !Array.isArray(data)) {
            if (data.otherPrimary === undefined) {
              const err28 = { instancePath, schemaPath: "#/allOf/2/oneOf/5/required", keyword: "required", params: { missingProperty: "otherPrimary" }, message: "must have required property '" + "otherPrimary" + "'" };
              if (vErrors === null) {
                vErrors = [err28];
              }
              else {
                vErrors.push(err28);
              }
              errors++;
            }
            if (data.otherPrimary !== undefined) {
              let data18 = data.otherPrimary;
              if (typeof data18 === "string") {
                if (func3(data18) < 1) {
                  const err29 = { instancePath: instancePath + "/otherPrimary", schemaPath: "#/allOf/2/oneOf/5/properties/otherPrimary/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err29];
                  }
                  else {
                    vErrors.push(err29);
                  }
                  errors++;
                }
              }
            }
          }
          var _valid2 = _errs47 === errors;
          if (_valid2 && valid6) {
            valid6 = false;
            passing0 = [passing0, 5];
          }
          else {
            if (_valid2) {
              valid6 = true;
              passing0 = 5;
              if (props1 !== true) {
                props1 = props1 || {};
                props1.otherPrimary = true;
              }
            }
          }
        }
      }
    }
  }
  if (!valid6) {
    const err30 = { instancePath, schemaPath: "#/allOf/2/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
    if (vErrors === null) {
      vErrors = [err30];
    }
    else {
      vErrors.push(err30);
    }
    errors++;
  }
  else {
    errors = _errs36;
    if (vErrors !== null) {
      if (_errs36) {
        vErrors.length = _errs36;
      }
      else {
        vErrors = null;
      }
    }
  }
  if (props0 !== true && props1 !== undefined) {
    if (props1 === true) {
      props0 = true;
    }
    else {
      props0 = props0 || {};
      Object.assign(props0, props1);
    }
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.consentGroupName === undefined) {
      const err31 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "consentGroupName" }, message: "must have required property '" + "consentGroupName" + "'" };
      if (vErrors === null) {
        vErrors = [err31];
      }
      else {
        vErrors.push(err31);
      }
      errors++;
    }
    if (data.fileTypes === undefined) {
      const err32 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "fileTypes" }, message: "must have required property '" + "fileTypes" + "'" };
      if (vErrors === null) {
        vErrors = [err32];
      }
      else {
        vErrors.push(err32);
      }
      errors++;
    }
    if (data.numberOfParticipants === undefined) {
      const err33 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "numberOfParticipants" }, message: "must have required property '" + "numberOfParticipants" + "'" };
      if (vErrors === null) {
        vErrors = [err33];
      }
      else {
        vErrors.push(err33);
      }
      errors++;
    }
    if (props0 !== true) {
      props0 = props0 || {};
      props0.datasetId = true;
      props0.consentGroupName = true;
      props0.openAccess = true;
      props0.generalResearchUse = true;
      props0.hmb = true;
      props0.diseaseSpecificUse = true;
      props0.poa = true;
      props0.otherPrimary = true;
      props0.dataLocation = true;
      props0.url = true;
      props0.numberOfParticipants = true;
      props0.fileTypes = true;
    }
    if (data.datasetId !== undefined) {
      let data19 = data.datasetId;
      if (!((typeof data19 == "number") && (!(data19 % 1) && !isNaN(data19)))) {
        const err34 = { instancePath: instancePath + "/datasetId", schemaPath: "#/properties/datasetId/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err34];
        }
        else {
          vErrors.push(err34);
        }
        errors++;
      }
    }
    if (data.consentGroupName !== undefined) {
      let data20 = data.consentGroupName;
      if (typeof data20 === "string") {
        if (func3(data20) < 1) {
          const err35 = { instancePath: instancePath + "/consentGroupName", schemaPath: "#/properties/consentGroupName/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err35];
          }
          else {
            vErrors.push(err35);
          }
          errors++;
        }
      }
      else {
        const err36 = { instancePath: instancePath + "/consentGroupName", schemaPath: "#/properties/consentGroupName/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err36];
        }
        else {
          vErrors.push(err36);
        }
        errors++;
      }
    }
    if (data.openAccess !== undefined) {
      if (typeof data.openAccess !== "boolean") {
        const err37 = { instancePath: instancePath + "/openAccess", schemaPath: "#/properties/openAccess/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err37];
        }
        else {
          vErrors.push(err37);
        }
        errors++;
      }
    }
    if (data.generalResearchUse !== undefined) {
      if (typeof data.generalResearchUse !== "boolean") {
        const err38 = { instancePath: instancePath + "/generalResearchUse", schemaPath: "#/properties/generalResearchUse/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err38];
        }
        else {
          vErrors.push(err38);
        }
        errors++;
      }
    }
    if (data.hmb !== undefined) {
      if (typeof data.hmb !== "boolean") {
        const err39 = { instancePath: instancePath + "/hmb", schemaPath: "#/properties/hmb/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err39];
        }
        else {
          vErrors.push(err39);
        }
        errors++;
      }
    }
    if (data.diseaseSpecificUse !== undefined) {
      let data24 = data.diseaseSpecificUse;
      if (Array.isArray(data24)) {
        const len0 = data24.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data24[i0] !== "string") {
            const err40 = { instancePath: instancePath + "/diseaseSpecificUse/" + i0, schemaPath: "#/properties/diseaseSpecificUse/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err40];
            }
            else {
              vErrors.push(err40);
            }
            errors++;
          }
        }
      }
      else {
        const err41 = { instancePath: instancePath + "/diseaseSpecificUse", schemaPath: "#/properties/diseaseSpecificUse/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err41];
        }
        else {
          vErrors.push(err41);
        }
        errors++;
      }
    }
    if (data.poa !== undefined) {
      if (typeof data.poa !== "boolean") {
        const err42 = { instancePath: instancePath + "/poa", schemaPath: "#/properties/poa/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err42];
        }
        else {
          vErrors.push(err42);
        }
        errors++;
      }
    }
    if (data.otherPrimary !== undefined) {
      if (typeof data.otherPrimary !== "string") {
        const err43 = { instancePath: instancePath + "/otherPrimary", schemaPath: "#/properties/otherPrimary/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err43];
        }
        else {
          vErrors.push(err43);
        }
        errors++;
      }
    }
    if (data.dataLocation !== undefined) {
      let data28 = data.dataLocation;
      if (typeof data28 !== "string") {
        const err44 = { instancePath: instancePath + "/dataLocation", schemaPath: "#/properties/dataLocation/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err44];
        }
        else {
          vErrors.push(err44);
        }
        errors++;
      }
      if (!((((data28 === "AnVIL Workspace") || (data28 === "Terra Workspace")) || (data28 === "TDR Location")) || (data28 === "Not Determined"))) {
        const err45 = { instancePath: instancePath + "/dataLocation", schemaPath: "#/properties/dataLocation/enum", keyword: "enum", params: { allowedValues: schema35.properties.dataLocation.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err45];
        }
        else {
          vErrors.push(err45);
        }
        errors++;
      }
    }
    if (data.url !== undefined) {
      let data29 = data.url;
      if (typeof data29 === "string") {
        if (func3(data29) < 1) {
          const err46 = { instancePath: instancePath + "/url", schemaPath: "#/properties/url/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err46];
          }
          else {
            vErrors.push(err46);
          }
          errors++;
        }
        // Default ajv URI validation is failing with "TypeError: formats12 is not a function"
        // if (!(formats12(data29))) {
        //   const err47 = { instancePath: instancePath + "/url", schemaPath: "#/properties/url/format", keyword: "format", params: { format: "uri" }, message: "must match format \"" + "uri" + "\"" };
        //   if (vErrors === null) {
        //     vErrors = [err47];
        //   }
        //   else {
        //     vErrors.push(err47);
        //   }
        //   errors++;
        // }
      }
      else {
        const err48 = { instancePath: instancePath + "/url", schemaPath: "#/properties/url/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err48];
        }
        else {
          vErrors.push(err48);
        }
        errors++;
      }
    }
    if (data.numberOfParticipants !== undefined) {
      let data30 = data.numberOfParticipants;
      if (!((typeof data30 == "number") && (!(data30 % 1) && !isNaN(data30)))) {
        const err49 = { instancePath: instancePath + "/numberOfParticipants", schemaPath: "#/properties/numberOfParticipants/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err49];
        }
        else {
          vErrors.push(err49);
        }
        errors++;
      }
    }
    if (data.fileTypes !== undefined) {
      let data31 = data.fileTypes;
      if (Array.isArray(data31)) {
        if (data31.length < 1) {
          const err50 = { instancePath: instancePath + "/fileTypes", schemaPath: "#/properties/fileTypes/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err50];
          }
          else {
            vErrors.push(err50);
          }
          errors++;
        }
        const len1 = data31.length;
        for (let i1 = 0; i1 < len1; i1++) {
          let data32 = data31[i1];
          if (data32 && typeof data32 == "object" && !Array.isArray(data32)) {
            if (data32.fileType !== undefined) {
              let data33 = data32.fileType;
              if (typeof data33 !== "string") {
                const err51 = { instancePath: instancePath + "/fileTypes/" + i1 + "/fileType", schemaPath: "#/$defs/fileTypeObject/properties/fileType/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err51];
                }
                else {
                  vErrors.push(err51);
                }
                errors++;
              }
              if (!(((((data33 === "Arrays") || (data33 === "Genome")) || (data33 === "Exome")) || (data33 === "Survey")) || (data33 === "Phenotype"))) {
                const err52 = { instancePath: instancePath + "/fileTypes/" + i1 + "/fileType", schemaPath: "#/$defs/fileTypeObject/properties/fileType/enum", keyword: "enum", params: { allowedValues: schema36.properties.fileType.enum }, message: "must be equal to one of the allowed values" };
                if (vErrors === null) {
                  vErrors = [err52];
                }
                else {
                  vErrors.push(err52);
                }
                errors++;
              }
            }
            if (data32.functionalEquivalence !== undefined) {
              if (typeof data32.functionalEquivalence !== "string") {
                const err53 = { instancePath: instancePath + "/fileTypes/" + i1 + "/functionalEquivalence", schemaPath: "#/$defs/fileTypeObject/properties/functionalEquivalence/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err53];
                }
                else {
                  vErrors.push(err53);
                }
                errors++;
              }
            }
          }
          else {
            const err54 = { instancePath: instancePath + "/fileTypes/" + i1, schemaPath: "#/$defs/fileTypeObject/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err54];
            }
            else {
              vErrors.push(err54);
            }
            errors++;
          }
        }
      }
      else {
        const err55 = { instancePath: instancePath + "/fileTypes", schemaPath: "#/properties/fileTypes/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err55];
        }
        else {
          vErrors.push(err55);
        }
        errors++;
      }
    }
  }
  else {
    const err56 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err56];
    }
    else {
      vErrors.push(err56);
    }
    errors++;
  }
  validate29.errors = vErrors;
  evaluated0.props = props0;
  return errors === 0;
}
validate29.evaluated = { "dynamicProps": true, "dynamicItems": false };


function validate28(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
/*# sourceURL="https://consent.dsde-prod.broadinstitute.org/schemas/dataset-registration" */;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate28.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  const _errs3 = errors;
  let valid1 = true;
  const _errs4 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    let missing0;
    if ((data.controlledAccessRequiredForGenomicSummaryResultsGSR === undefined) && (missing0 = "controlledAccessRequiredForGenomicSummaryResultsGSR")) {
      const err0 = {};
      if (vErrors === null) {
        vErrors = [err0];
      }
      else {
        vErrors.push(err0);
      }
      errors++;
    }
    else {
      if (data.controlledAccessRequiredForGenomicSummaryResultsGSR !== undefined) {
        if (true !== data.controlledAccessRequiredForGenomicSummaryResultsGSR) {
          const err1 = {};
          if (vErrors === null) {
            vErrors = [err1];
          }
          else {
            vErrors.push(err1);
          }
          errors++;
        }
      }
    }
  }
  var _valid0 = _errs4 === errors;
  errors = _errs3;
  if (vErrors !== null) {
    if (_errs3) {
      vErrors.length = _errs3;
    }
    else {
      vErrors = null;
    }
  }
  if (_valid0) {
    const _errs6 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation === undefined) {
        const err2 = { instancePath, schemaPath: "#/allOf/0/then/required", keyword: "required", params: { missingProperty: "controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation" }, message: "must have required property '" + "controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation" + "'" };
        if (vErrors === null) {
          vErrors = [err2];
        }
        else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    var _valid0 = _errs6 === errors;
    valid1 = _valid0;
  }
  if (!valid1) {
    const err3 = { instancePath, schemaPath: "#/allOf/0/if", keyword: "if", params: { failingKeyword: "then" }, message: "must match \"then\" schema" };
    if (vErrors === null) {
      vErrors = [err3];
    }
    else {
      vErrors.push(err3);
    }
    errors++;
  }
  const _errs9 = errors;
  let valid3 = true;
  const _errs10 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    let missing1;
    if ((data.nihAnvilUse === undefined) && (missing1 = "nihAnvilUse")) {
      const err4 = {};
      if (vErrors === null) {
        vErrors = [err4];
      }
      else {
        vErrors.push(err4);
      }
      errors++;
    }
    else {
      if (data.nihAnvilUse !== undefined) {
        let data1 = data.nihAnvilUse;
        if (typeof data1 !== "string") {
          const err5 = {};
          if (vErrors === null) {
            vErrors = [err5];
          }
          else {
            vErrors.push(err5);
          }
          errors++;
        }
        if (!(data1 === "I am NHGRI funded and I have a dbGaP PHS ID already")) {
          const err6 = {};
          if (vErrors === null) {
            vErrors = [err6];
          }
          else {
            vErrors.push(err6);
          }
          errors++;
        }
      }
    }
  }
  var _valid1 = _errs10 === errors;
  errors = _errs9;
  if (vErrors !== null) {
    if (_errs9) {
      vErrors.length = _errs9;
    }
    else {
      vErrors = null;
    }
  }
  if (_valid1) {
    const _errs13 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.dbGaPPhsID === undefined) {
        const err7 = { instancePath, schemaPath: "#/$defs/dbGaPInfo/required", keyword: "required", params: { missingProperty: "dbGaPPhsID" }, message: "must have required property '" + "dbGaPPhsID" + "'" };
        if (vErrors === null) {
          vErrors = [err7];
        }
        else {
          vErrors.push(err7);
        }
        errors++;
      }
      if (data.dbGaPPhsID !== undefined) {
        let data2 = data.dbGaPPhsID;
        if (typeof data2 === "string") {
          if (func3(data2) < 1) {
            const err8 = { instancePath: instancePath + "/dbGaPPhsID", schemaPath: "#/$defs/dbGaPInfo/properties/dbGaPPhsID/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
            if (vErrors === null) {
              vErrors = [err8];
            }
            else {
              vErrors.push(err8);
            }
            errors++;
          }
        }
        else {
          const err9 = { instancePath: instancePath + "/dbGaPPhsID", schemaPath: "#/$defs/dbGaPInfo/properties/dbGaPPhsID/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err9];
          }
          else {
            vErrors.push(err9);
          }
          errors++;
        }
      }
      if (data.dbGaPStudyRegistrationName !== undefined) {
        if (typeof data.dbGaPStudyRegistrationName !== "string") {
          const err10 = { instancePath: instancePath + "/dbGaPStudyRegistrationName", schemaPath: "#/$defs/dbGaPInfo/properties/dbGaPStudyRegistrationName/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err10];
          }
          else {
            vErrors.push(err10);
          }
          errors++;
        }
      }
      if (data.embargoReleaseDate !== undefined) {
        let data4 = data.embargoReleaseDate;
        if (typeof data4 === "string") {
          if (!(formats0.validate(data4))) {
            const err11 = { instancePath: instancePath + "/embargoReleaseDate", schemaPath: "#/$defs/dbGaPInfo/properties/embargoReleaseDate/format", keyword: "format", params: { format: "date" }, message: "must match format \"" + "date" + "\"" };
            if (vErrors === null) {
              vErrors = [err11];
            }
            else {
              vErrors.push(err11);
            }
            errors++;
          }
        }
        else {
          const err12 = { instancePath: instancePath + "/embargoReleaseDate", schemaPath: "#/$defs/dbGaPInfo/properties/embargoReleaseDate/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err12];
          }
          else {
            vErrors.push(err12);
          }
          errors++;
        }
      }
      if (data.sequencingCenter !== undefined) {
        if (typeof data.sequencingCenter !== "string") {
          const err13 = { instancePath: instancePath + "/sequencingCenter", schemaPath: "#/$defs/dbGaPInfo/properties/sequencingCenter/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err13];
          }
          else {
            vErrors.push(err13);
          }
          errors++;
        }
      }
    }
    var _valid1 = _errs13 === errors;
    valid3 = _valid1;
    if (valid3) {
      var props0 = {};
      props0.dbGaPPhsID = true;
      props0.dbGaPStudyRegistrationName = true;
      props0.embargoReleaseDate = true;
      props0.sequencingCenter = true;
      props0.nihAnvilUse = true;
    }
  }
  if (!valid3) {
    const err14 = { instancePath, schemaPath: "#/allOf/1/if", keyword: "if", params: { failingKeyword: "then" }, message: "must match \"then\" schema" };
    if (vErrors === null) {
      vErrors = [err14];
    }
    else {
      vErrors.push(err14);
    }
    errors++;
  }
  if (props0 !== true) {
    props0 = props0 || {};
    props0.controlledAccessRequiredForGenomicSummaryResultsGSR = true;
  }
  const _errs25 = errors;
  let valid7 = true;
  const _errs26 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    let missing2;
    if ((data.nihAnvilUse === undefined) && (missing2 = "nihAnvilUse")) {
      const err15 = {};
      if (vErrors === null) {
        vErrors = [err15];
      }
      else {
        vErrors.push(err15);
      }
      errors++;
    }
    else {
      if (data.nihAnvilUse !== undefined) {
        let data6 = data.nihAnvilUse;
        if (typeof data6 !== "string") {
          const err16 = {};
          if (vErrors === null) {
            vErrors = [err16];
          }
          else {
            vErrors.push(err16);
          }
          errors++;
        }
        if (!(((data6 === "I am NHGRI funded and I have a dbGaP PHS ID already") || (data6 === "I am NHGRI funded and I do not have a dbGaP PHS ID")) || (data6 === "I am not NHGRI funded but I am seeking to submit data to AnVIL"))) {
          const err17 = {};
          if (vErrors === null) {
            vErrors = [err17];
          }
          else {
            vErrors.push(err17);
          }
          errors++;
        }
      }
    }
  }
  var _valid2 = _errs26 === errors;
  errors = _errs25;
  if (vErrors !== null) {
    if (_errs25) {
      vErrors.length = _errs25;
    }
    else {
      vErrors = null;
    }
  }
  if (_valid2) {
    const _errs29 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.piInstitution === undefined) {
        const err18 = { instancePath, schemaPath: "#/$defs/nihAdministrativeInformation/required", keyword: "required", params: { missingProperty: "piInstitution" }, message: "must have required property '" + "piInstitution" + "'" };
        if (vErrors === null) {
          vErrors = [err18];
        }
        else {
          vErrors.push(err18);
        }
        errors++;
      }
      if (data.nihGrantContractNumber === undefined) {
        const err19 = { instancePath, schemaPath: "#/$defs/nihAdministrativeInformation/required", keyword: "required", params: { missingProperty: "nihGrantContractNumber" }, message: "must have required property '" + "nihGrantContractNumber" + "'" };
        if (vErrors === null) {
          vErrors = [err19];
        }
        else {
          vErrors.push(err19);
        }
        errors++;
      }
      if (data.piInstitution !== undefined) {
        let data7 = data.piInstitution;
        if (!((typeof data7 == "number") && (!(data7 % 1) && !isNaN(data7)))) {
          const err20 = { instancePath: instancePath + "/piInstitution", schemaPath: "#/$defs/nihAdministrativeInformation/properties/piInstitution/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
          if (vErrors === null) {
            vErrors = [err20];
          }
          else {
            vErrors.push(err20);
          }
          errors++;
        }
      }
      if (data.nihGrantContractNumber !== undefined) {
        let data8 = data.nihGrantContractNumber;
        if (typeof data8 === "string") {
          if (func3(data8) < 1) {
            const err21 = { instancePath: instancePath + "/nihGrantContractNumber", schemaPath: "#/$defs/nihAdministrativeInformation/properties/nihGrantContractNumber/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
            if (vErrors === null) {
              vErrors = [err21];
            }
            else {
              vErrors.push(err21);
            }
            errors++;
          }
        }
        else {
          const err22 = { instancePath: instancePath + "/nihGrantContractNumber", schemaPath: "#/$defs/nihAdministrativeInformation/properties/nihGrantContractNumber/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err22];
          }
          else {
            vErrors.push(err22);
          }
          errors++;
        }
      }
      if (data.nihICsSupportingStudy !== undefined) {
        let data9 = data.nihICsSupportingStudy;
        if (Array.isArray(data9)) {
          const len0 = data9.length;
          for (let i0 = 0; i0 < len0; i0++) {
            let data10 = data9[i0];
            if (typeof data10 !== "string") {
              const err23 = { instancePath: instancePath + "/nihICsSupportingStudy/" + i0, schemaPath: "#/$defs/nihAdministrativeInformation/properties/nihICsSupportingStudy/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err23];
              }
              else {
                vErrors.push(err23);
              }
              errors++;
            }
            if (!(((((((((((((((((((((((((((data10 === "NCI") || (data10 === "NEI")) || (data10 === "NHLBI")) || (data10 === "NHGRI")) || (data10 === "NIA")) || (data10 === "NIAAA")) || (data10 === "NIAID")) || (data10 === "NIAMS")) || (data10 === "NIBIB")) || (data10 === "NICHD")) || (data10 === "NIDCD")) || (data10 === "NIDCR")) || (data10 === "NIDDK")) || (data10 === "NIDA")) || (data10 === "NIEHS")) || (data10 === "NIGMS")) || (data10 === "NIMH")) || (data10 === "NIMHD")) || (data10 === "NINDS")) || (data10 === "NINR")) || (data10 === "NLM")) || (data10 === "CC")) || (data10 === "CIT")) || (data10 === "CSR")) || (data10 === "FIC")) || (data10 === "NCATS")) || (data10 === "NCCIH"))) {
              const err24 = { instancePath: instancePath + "/nihICsSupportingStudy/" + i0, schemaPath: "#/$defs/nihAdministrativeInformation/properties/nihICsSupportingStudy/items/enum", keyword: "enum", params: { allowedValues: schema34.properties.nihICsSupportingStudy.items.enum }, message: "must be equal to one of the allowed values" };
              if (vErrors === null) {
                vErrors = [err24];
              }
              else {
                vErrors.push(err24);
              }
              errors++;
            }
          }
        }
        else {
          const err25 = { instancePath: instancePath + "/nihICsSupportingStudy", schemaPath: "#/$defs/nihAdministrativeInformation/properties/nihICsSupportingStudy/type", keyword: "type", params: { type: "array" }, message: "must be array" };
          if (vErrors === null) {
            vErrors = [err25];
          }
          else {
            vErrors.push(err25);
          }
          errors++;
        }
      }
      if (data.nihProgramOfficerName !== undefined) {
        if (typeof data.nihProgramOfficerName !== "string") {
          const err26 = { instancePath: instancePath + "/nihProgramOfficerName", schemaPath: "#/$defs/nihAdministrativeInformation/properties/nihProgramOfficerName/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err26];
          }
          else {
            vErrors.push(err26);
          }
          errors++;
        }
      }
      if (data.nihInstitutionCenterSubmission !== undefined) {
        let data12 = data.nihInstitutionCenterSubmission;
        if (typeof data12 !== "string") {
          const err27 = { instancePath: instancePath + "/nihInstitutionCenterSubmission", schemaPath: "#/$defs/nihAdministrativeInformation/properties/nihInstitutionCenterSubmission/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err27];
          }
          else {
            vErrors.push(err27);
          }
          errors++;
        }
        if (!(((((((((((((((((((((((((((data12 === "NCI") || (data12 === "NEI")) || (data12 === "NHLBI")) || (data12 === "NHGRI")) || (data12 === "NIA")) || (data12 === "NIAAA")) || (data12 === "NIAID")) || (data12 === "NIAMS")) || (data12 === "NIBIB")) || (data12 === "NICHD")) || (data12 === "NIDCD")) || (data12 === "NIDCR")) || (data12 === "NIDDK")) || (data12 === "NIDA")) || (data12 === "NIEHS")) || (data12 === "NIGMS")) || (data12 === "NIMH")) || (data12 === "NIMHD")) || (data12 === "NINDS")) || (data12 === "NINR")) || (data12 === "NLM")) || (data12 === "CC")) || (data12 === "CIT")) || (data12 === "CSR")) || (data12 === "FIC")) || (data12 === "NCATS")) || (data12 === "NCCIH"))) {
          const err28 = { instancePath: instancePath + "/nihInstitutionCenterSubmission", schemaPath: "#/$defs/nihAdministrativeInformation/properties/nihInstitutionCenterSubmission/enum", keyword: "enum", params: { allowedValues: schema34.properties.nihInstitutionCenterSubmission.enum }, message: "must be equal to one of the allowed values" };
          if (vErrors === null) {
            vErrors = [err28];
          }
          else {
            vErrors.push(err28);
          }
          errors++;
        }
      }
      if (data.nihGenomicProgramAdministratorName !== undefined) {
        if (typeof data.nihGenomicProgramAdministratorName !== "string") {
          const err29 = { instancePath: instancePath + "/nihGenomicProgramAdministratorName", schemaPath: "#/$defs/nihAdministrativeInformation/properties/nihGenomicProgramAdministratorName/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err29];
          }
          else {
            vErrors.push(err29);
          }
          errors++;
        }
      }
      if (data.multiCenterStudy !== undefined) {
        if (typeof data.multiCenterStudy !== "boolean") {
          const err30 = { instancePath: instancePath + "/multiCenterStudy", schemaPath: "#/$defs/nihAdministrativeInformation/properties/multiCenterStudy/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
          if (vErrors === null) {
            vErrors = [err30];
          }
          else {
            vErrors.push(err30);
          }
          errors++;
        }
      }
      if (data.collaboratingSites !== undefined) {
        let data15 = data.collaboratingSites;
        if (Array.isArray(data15)) {
          const len1 = data15.length;
          for (let i1 = 0; i1 < len1; i1++) {
            if (typeof data15[i1] !== "string") {
              const err31 = { instancePath: instancePath + "/collaboratingSites/" + i1, schemaPath: "#/$defs/nihAdministrativeInformation/properties/collaboratingSites/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err31];
              }
              else {
                vErrors.push(err31);
              }
              errors++;
            }
          }
        }
        else {
          const err32 = { instancePath: instancePath + "/collaboratingSites", schemaPath: "#/$defs/nihAdministrativeInformation/properties/collaboratingSites/type", keyword: "type", params: { type: "array" }, message: "must be array" };
          if (vErrors === null) {
            vErrors = [err32];
          }
          else {
            vErrors.push(err32);
          }
          errors++;
        }
      }
      if (data.controlledAccessRequiredForGenomicSummaryResultsGSR !== undefined) {
        if (typeof data.controlledAccessRequiredForGenomicSummaryResultsGSR !== "boolean") {
          const err33 = { instancePath: instancePath + "/controlledAccessRequiredForGenomicSummaryResultsGSR", schemaPath: "#/$defs/nihAdministrativeInformation/properties/controlledAccessRequiredForGenomicSummaryResultsGSR/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
          if (vErrors === null) {
            vErrors = [err33];
          }
          else {
            vErrors.push(err33);
          }
          errors++;
        }
      }
      if (data.controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation !== undefined) {
        let data18 = data.controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation;
        if (typeof data18 === "string") {
          if (func3(data18) < 1) {
            const err34 = { instancePath: instancePath + "/controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation", schemaPath: "#/$defs/nihAdministrativeInformation/properties/controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
            if (vErrors === null) {
              vErrors = [err34];
            }
            else {
              vErrors.push(err34);
            }
            errors++;
          }
        }
        else {
          const err35 = { instancePath: instancePath + "/controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation", schemaPath: "#/$defs/nihAdministrativeInformation/properties/controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err35];
          }
          else {
            vErrors.push(err35);
          }
          errors++;
        }
      }
      if (data.alternativeDataSharingPlan !== undefined) {
        if (typeof data.alternativeDataSharingPlan !== "boolean") {
          const err36 = { instancePath: instancePath + "/alternativeDataSharingPlan", schemaPath: "#/$defs/nihAdministrativeInformation/properties/alternativeDataSharingPlan/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
          if (vErrors === null) {
            vErrors = [err36];
          }
          else {
            vErrors.push(err36);
          }
          errors++;
        }
      }
      if (data.alternativeDataSharingPlanReasons !== undefined) {
        let data20 = data.alternativeDataSharingPlanReasons;
        if (Array.isArray(data20)) {
          const len2 = data20.length;
          for (let i2 = 0; i2 < len2; i2++) {
            let data21 = data20[i2];
            if (typeof data21 !== "string") {
              const err37 = { instancePath: instancePath + "/alternativeDataSharingPlanReasons/" + i2, schemaPath: "#/$defs/nihAdministrativeInformation/properties/alternativeDataSharingPlanReasons/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err37];
              }
              else {
                vErrors.push(err37);
              }
              errors++;
            }
            if (!((((((((data21 === "Legal Restrictions") || (data21 === "Informed consent processes are inadequate to support data for sharing for the following reasons:")) || (data21 === "The consent forms are unavailable or non-existent for samples collected after January 25, 2015")) || (data21 === "The consent process did not specifically address future use or broad data sharing for samples collected after January 25, 2015")) || (data21 === "The consent process inadequately addresses risks related to future use or broad data sharing for samples collected after January 25, 2015")) || (data21 === "The consent process specifically precludes future use or broad data sharing (including a statement that use of data will be limited to the original researchers)")) || (data21 === "Other informed consent limitations or concerns")) || (data21 === "Other"))) {
              const err38 = { instancePath: instancePath + "/alternativeDataSharingPlanReasons/" + i2, schemaPath: "#/$defs/nihAdministrativeInformation/properties/alternativeDataSharingPlanReasons/items/enum", keyword: "enum", params: { allowedValues: schema34.properties.alternativeDataSharingPlanReasons.items.enum }, message: "must be equal to one of the allowed values" };
              if (vErrors === null) {
                vErrors = [err38];
              }
              else {
                vErrors.push(err38);
              }
              errors++;
            }
          }
        }
        else {
          const err39 = { instancePath: instancePath + "/alternativeDataSharingPlanReasons", schemaPath: "#/$defs/nihAdministrativeInformation/properties/alternativeDataSharingPlanReasons/type", keyword: "type", params: { type: "array" }, message: "must be array" };
          if (vErrors === null) {
            vErrors = [err39];
          }
          else {
            vErrors.push(err39);
          }
          errors++;
        }
      }
      if (data.alternativeDataSharingPlanExplanation !== undefined) {
        if (typeof data.alternativeDataSharingPlanExplanation !== "string") {
          const err40 = { instancePath: instancePath + "/alternativeDataSharingPlanExplanation", schemaPath: "#/$defs/nihAdministrativeInformation/properties/alternativeDataSharingPlanExplanation/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err40];
          }
          else {
            vErrors.push(err40);
          }
          errors++;
        }
      }
      if (data.alternativeDataSharingPlanFileName !== undefined) {
        if (typeof data.alternativeDataSharingPlanFileName !== "string") {
          const err41 = { instancePath: instancePath + "/alternativeDataSharingPlanFileName", schemaPath: "#/$defs/nihAdministrativeInformation/properties/alternativeDataSharingPlanFileName/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err41];
          }
          else {
            vErrors.push(err41);
          }
          errors++;
        }
      }
      if (data.alternativeDataSharingPlanDataSubmitted !== undefined) {
        let data24 = data.alternativeDataSharingPlanDataSubmitted;
        if (typeof data24 !== "string") {
          const err42 = { instancePath: instancePath + "/alternativeDataSharingPlanDataSubmitted", schemaPath: "#/$defs/nihAdministrativeInformation/properties/alternativeDataSharingPlanDataSubmitted/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err42];
          }
          else {
            vErrors.push(err42);
          }
          errors++;
        }
        if (!((data24 === "Within 3 months of the last data generated or last clinical visit") || (data24 === "By batches over Study Timeline (e.g. based on clinical trial enrollment benchmarks)"))) {
          const err43 = { instancePath: instancePath + "/alternativeDataSharingPlanDataSubmitted", schemaPath: "#/$defs/nihAdministrativeInformation/properties/alternativeDataSharingPlanDataSubmitted/enum", keyword: "enum", params: { allowedValues: schema34.properties.alternativeDataSharingPlanDataSubmitted.enum }, message: "must be equal to one of the allowed values" };
          if (vErrors === null) {
            vErrors = [err43];
          }
          else {
            vErrors.push(err43);
          }
          errors++;
        }
      }
      if (data.alternativeDataSharingPlanDataReleased !== undefined) {
        if (typeof data.alternativeDataSharingPlanDataReleased !== "boolean") {
          const err44 = { instancePath: instancePath + "/alternativeDataSharingPlanDataReleased", schemaPath: "#/$defs/nihAdministrativeInformation/properties/alternativeDataSharingPlanDataReleased/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
          if (vErrors === null) {
            vErrors = [err44];
          }
          else {
            vErrors.push(err44);
          }
          errors++;
        }
      }
      if (data.alternativeDataSharingPlanTargetDeliveryDate !== undefined) {
        let data26 = data.alternativeDataSharingPlanTargetDeliveryDate;
        if (typeof data26 === "string") {
          if (!(formats0.validate(data26))) {
            const err45 = { instancePath: instancePath + "/alternativeDataSharingPlanTargetDeliveryDate", schemaPath: "#/$defs/nihAdministrativeInformation/properties/alternativeDataSharingPlanTargetDeliveryDate/format", keyword: "format", params: { format: "date" }, message: "must match format \"" + "date" + "\"" };
            if (vErrors === null) {
              vErrors = [err45];
            }
            else {
              vErrors.push(err45);
            }
            errors++;
          }
        }
        else {
          const err46 = { instancePath: instancePath + "/alternativeDataSharingPlanTargetDeliveryDate", schemaPath: "#/$defs/nihAdministrativeInformation/properties/alternativeDataSharingPlanTargetDeliveryDate/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err46];
          }
          else {
            vErrors.push(err46);
          }
          errors++;
        }
      }
      if (data.alternativeDataSharingPlanControlledOpenAccess !== undefined) {
        let data27 = data.alternativeDataSharingPlanControlledOpenAccess;
        if (typeof data27 !== "string") {
          const err47 = { instancePath: instancePath + "/alternativeDataSharingPlanControlledOpenAccess", schemaPath: "#/$defs/nihAdministrativeInformation/properties/alternativeDataSharingPlanControlledOpenAccess/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err47];
          }
          else {
            vErrors.push(err47);
          }
          errors++;
        }
        if (!((data27 === "Controlled Access") || (data27 === "Open Access"))) {
          const err48 = { instancePath: instancePath + "/alternativeDataSharingPlanControlledOpenAccess", schemaPath: "#/$defs/nihAdministrativeInformation/properties/alternativeDataSharingPlanControlledOpenAccess/enum", keyword: "enum", params: { allowedValues: schema34.properties.alternativeDataSharingPlanControlledOpenAccess.enum }, message: "must be equal to one of the allowed values" };
          if (vErrors === null) {
            vErrors = [err48];
          }
          else {
            vErrors.push(err48);
          }
          errors++;
        }
      }
    }
    var _valid2 = _errs29 === errors;
    valid7 = _valid2;
    if (valid7) {
      var props1 = {};
      props1.piInstitution = true;
      props1.nihGrantContractNumber = true;
      props1.nihICsSupportingStudy = true;
      props1.nihProgramOfficerName = true;
      props1.nihInstitutionCenterSubmission = true;
      props1.nihGenomicProgramAdministratorName = true;
      props1.multiCenterStudy = true;
      props1.collaboratingSites = true;
      props1.controlledAccessRequiredForGenomicSummaryResultsGSR = true;
      props1.controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation = true;
      props1.alternativeDataSharingPlan = true;
      props1.alternativeDataSharingPlanReasons = true;
      props1.alternativeDataSharingPlanExplanation = true;
      props1.alternativeDataSharingPlanFileName = true;
      props1.alternativeDataSharingPlanDataSubmitted = true;
      props1.alternativeDataSharingPlanDataReleased = true;
      props1.alternativeDataSharingPlanTargetDeliveryDate = true;
      props1.alternativeDataSharingPlanControlledOpenAccess = true;
      props1.nihAnvilUse = true;
    }
  }
  if (!valid7) {
    const err49 = { instancePath, schemaPath: "#/allOf/2/if", keyword: "if", params: { failingKeyword: "then" }, message: "must match \"then\" schema" };
    if (vErrors === null) {
      vErrors = [err49];
    }
    else {
      vErrors.push(err49);
    }
    errors++;
  }
  if (props0 !== true && props1 !== undefined) {
    if (props1 === true) {
      props0 = true;
    }
    else {
      props0 = props0 || {};
      Object.assign(props0, props1);
    }
  }
  const _errs75 = errors;
  let valid17 = true;
  const _errs76 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    let missing3;
    if ((data.alternativeDataSharingPlan === undefined) && (missing3 = "alternativeDataSharingPlan")) {
      const err50 = {};
      if (vErrors === null) {
        vErrors = [err50];
      }
      else {
        vErrors.push(err50);
      }
      errors++;
    }
    else {
      if (data.alternativeDataSharingPlan !== undefined) {
        if (true !== data.alternativeDataSharingPlan) {
          const err51 = {};
          if (vErrors === null) {
            vErrors = [err51];
          }
          else {
            vErrors.push(err51);
          }
          errors++;
        }
      }
    }
  }
  var _valid3 = _errs76 === errors;
  errors = _errs75;
  if (vErrors !== null) {
    if (_errs75) {
      vErrors.length = _errs75;
    }
    else {
      vErrors = null;
    }
  }
  if (_valid3) {
    const _errs78 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.alternativeDataSharingPlanExplanation === undefined) {
        const err52 = { instancePath, schemaPath: "#/allOf/3/then/required", keyword: "required", params: { missingProperty: "alternativeDataSharingPlanExplanation" }, message: "must have required property '" + "alternativeDataSharingPlanExplanation" + "'" };
        if (vErrors === null) {
          vErrors = [err52];
        }
        else {
          vErrors.push(err52);
        }
        errors++;
      }
      if (data.alternativeDataSharingPlanReasons === undefined) {
        const err53 = { instancePath, schemaPath: "#/allOf/3/then/required", keyword: "required", params: { missingProperty: "alternativeDataSharingPlanReasons" }, message: "must have required property '" + "alternativeDataSharingPlanReasons" + "'" };
        if (vErrors === null) {
          vErrors = [err53];
        }
        else {
          vErrors.push(err53);
        }
        errors++;
      }
      if (data.alternativeDataSharingPlanReasons !== undefined) {
        let data29 = data.alternativeDataSharingPlanReasons;
        if (Array.isArray(data29)) {
          if (data29.length < 1) {
            const err54 = { instancePath: instancePath + "/alternativeDataSharingPlanReasons", schemaPath: "#/allOf/3/then/properties/alternativeDataSharingPlanReasons/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
            if (vErrors === null) {
              vErrors = [err54];
            }
            else {
              vErrors.push(err54);
            }
            errors++;
          }
        }
      }
    }
    var _valid3 = _errs78 === errors;
    valid17 = _valid3;
    if (valid17) {
      var props2 = {};
      props2.alternativeDataSharingPlanReasons = true;
      props2.alternativeDataSharingPlan = true;
    }
  }
  if (!valid17) {
    const err55 = { instancePath, schemaPath: "#/allOf/3/if", keyword: "if", params: { failingKeyword: "then" }, message: "must match \"then\" schema" };
    if (vErrors === null) {
      vErrors = [err55];
    }
    else {
      vErrors.push(err55);
    }
    errors++;
  }
  if (props0 !== true && props2 !== undefined) {
    if (props2 === true) {
      props0 = true;
    }
    else {
      props0 = props0 || {};
      Object.assign(props0, props2);
    }
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.studyName === undefined) {
      const err56 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "studyName" }, message: "must have required property '" + "studyName" + "'" };
      if (vErrors === null) {
        vErrors = [err56];
      }
      else {
        vErrors.push(err56);
      }
      errors++;
    }
    if (data.studyDescription === undefined) {
      const err57 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "studyDescription" }, message: "must have required property '" + "studyDescription" + "'" };
      if (vErrors === null) {
        vErrors = [err57];
      }
      else {
        vErrors.push(err57);
      }
      errors++;
    }
    if (data.dataTypes === undefined) {
      const err58 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "dataTypes" }, message: "must have required property '" + "dataTypes" + "'" };
      if (vErrors === null) {
        vErrors = [err58];
      }
      else {
        vErrors.push(err58);
      }
      errors++;
    }
    if (data.dataSubmitterUserId === undefined) {
      const err59 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "dataSubmitterUserId" }, message: "must have required property '" + "dataSubmitterUserId" + "'" };
      if (vErrors === null) {
        vErrors = [err59];
      }
      else {
        vErrors.push(err59);
      }
      errors++;
    }
    if (data.publicVisibility === undefined) {
      const err60 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "publicVisibility" }, message: "must have required property '" + "publicVisibility" + "'" };
      if (vErrors === null) {
        vErrors = [err60];
      }
      else {
        vErrors.push(err60);
      }
      errors++;
    }
    if (data.nihAnvilUse === undefined) {
      const err61 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "nihAnvilUse" }, message: "must have required property '" + "nihAnvilUse" + "'" };
      if (vErrors === null) {
        vErrors = [err61];
      }
      else {
        vErrors.push(err61);
      }
      errors++;
    }
    if (data.piName === undefined) {
      const err62 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "piName" }, message: "must have required property '" + "piName" + "'" };
      if (vErrors === null) {
        vErrors = [err62];
      }
      else {
        vErrors.push(err62);
      }
      errors++;
    }
    if (data.consentGroups === undefined) {
      const err63 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "consentGroups" }, message: "must have required property '" + "consentGroups" + "'" };
      if (vErrors === null) {
        vErrors = [err63];
      }
      else {
        vErrors.push(err63);
      }
      errors++;
    }
    if (props0 !== true) {
      props0 = props0 || {};
      props0.studyName = true;
      props0.studyType = true;
      props0.studyDescription = true;
      props0.dataTypes = true;
      props0.phenotypeIndication = true;
      props0.species = true;
      props0.piName = true;
      props0.dataSubmitterUserId = true;
      props0.dataCustodianEmail = true;
      props0.publicVisibility = true;
      props0.nihAnvilUse = true;
      props0.targetDeliveryDate = true;
      props0.targetPublicReleaseDate = true;
      props0.consentGroups = true;
    }
    if (data.studyName !== undefined) {
      let data30 = data.studyName;
      if (typeof data30 === "string") {
        if (func3(data30) < 1) {
          const err64 = { instancePath: instancePath + "/studyName", schemaPath: "#/properties/studyName/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err64];
          }
          else {
            vErrors.push(err64);
          }
          errors++;
        }
      }
      else {
        const err65 = { instancePath: instancePath + "/studyName", schemaPath: "#/properties/studyName/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err65];
        }
        else {
          vErrors.push(err65);
        }
        errors++;
      }
    }
    if (data.studyType !== undefined) {
      let data31 = data.studyType;
      if (typeof data31 !== "string") {
        const err66 = { instancePath: instancePath + "/studyType", schemaPath: "#/properties/studyType/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err66];
        }
        else {
          vErrors.push(err66);
        }
        errors++;
      }
      if (!((((((((((data31 === "Observational") || (data31 === "Interventional")) || (data31 === "Descriptive")) || (data31 === "Analytical")) || (data31 === "Prospective")) || (data31 === "Retrospective")) || (data31 === "Case report")) || (data31 === "Case series")) || (data31 === "Cross-sectional")) || (data31 === "Cohort study"))) {
        const err67 = { instancePath: instancePath + "/studyType", schemaPath: "#/properties/studyType/enum", keyword: "enum", params: { allowedValues: schema32.properties.studyType.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err67];
        }
        else {
          vErrors.push(err67);
        }
        errors++;
      }
    }
    if (data.studyDescription !== undefined) {
      let data32 = data.studyDescription;
      if (typeof data32 === "string") {
        if (func3(data32) < 1) {
          const err68 = { instancePath: instancePath + "/studyDescription", schemaPath: "#/properties/studyDescription/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err68];
          }
          else {
            vErrors.push(err68);
          }
          errors++;
        }
      }
      else {
        const err69 = { instancePath: instancePath + "/studyDescription", schemaPath: "#/properties/studyDescription/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err69];
        }
        else {
          vErrors.push(err69);
        }
        errors++;
      }
    }
    if (data.dataTypes !== undefined) {
      let data33 = data.dataTypes;
      if (Array.isArray(data33)) {
        if (data33.length < 1) {
          const err70 = { instancePath: instancePath + "/dataTypes", schemaPath: "#/properties/dataTypes/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err70];
          }
          else {
            vErrors.push(err70);
          }
          errors++;
        }
        const len3 = data33.length;
        for (let i3 = 0; i3 < len3; i3++) {
          if (typeof data33[i3] !== "string") {
            const err71 = { instancePath: instancePath + "/dataTypes/" + i3, schemaPath: "#/properties/dataTypes/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err71];
            }
            else {
              vErrors.push(err71);
            }
            errors++;
          }
        }
      }
      else {
        const err72 = { instancePath: instancePath + "/dataTypes", schemaPath: "#/properties/dataTypes/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err72];
        }
        else {
          vErrors.push(err72);
        }
        errors++;
      }
    }
    if (data.phenotypeIndication !== undefined) {
      if (typeof data.phenotypeIndication !== "string") {
        const err73 = { instancePath: instancePath + "/phenotypeIndication", schemaPath: "#/properties/phenotypeIndication/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err73];
        }
        else {
          vErrors.push(err73);
        }
        errors++;
      }
    }
    if (data.species !== undefined) {
      if (typeof data.species !== "string") {
        const err74 = { instancePath: instancePath + "/species", schemaPath: "#/properties/species/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err74];
        }
        else {
          vErrors.push(err74);
        }
        errors++;
      }
    }
    if (data.piName !== undefined) {
      let data37 = data.piName;
      if (typeof data37 === "string") {
        if (func3(data37) < 1) {
          const err75 = { instancePath: instancePath + "/piName", schemaPath: "#/properties/piName/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err75];
          }
          else {
            vErrors.push(err75);
          }
          errors++;
        }
      }
      else {
        const err76 = { instancePath: instancePath + "/piName", schemaPath: "#/properties/piName/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err76];
        }
        else {
          vErrors.push(err76);
        }
        errors++;
      }
    }
    if (data.dataSubmitterUserId !== undefined) {
      let data38 = data.dataSubmitterUserId;
      if (!((typeof data38 == "number") && (!(data38 % 1) && !isNaN(data38)))) {
        const err77 = { instancePath: instancePath + "/dataSubmitterUserId", schemaPath: "#/properties/dataSubmitterUserId/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err77];
        }
        else {
          vErrors.push(err77);
        }
        errors++;
      }
    }
    if (data.dataCustodianEmail !== undefined) {
      let data39 = data.dataCustodianEmail;
      if (Array.isArray(data39)) {
        const len4 = data39.length;
        for (let i4 = 0; i4 < len4; i4++) {
          let data40 = data39[i4];
          if (typeof data40 === "string") {
            if (!(formats4.test(data40))) {
              const err78 = { instancePath: instancePath + "/dataCustodianEmail/" + i4, schemaPath: "#/properties/dataCustodianEmail/items/format", keyword: "format", params: { format: "email" }, message: "must match format \"" + "email" + "\"" };
              if (vErrors === null) {
                vErrors = [err78];
              }
              else {
                vErrors.push(err78);
              }
              errors++;
            }
          }
          else {
            const err79 = { instancePath: instancePath + "/dataCustodianEmail/" + i4, schemaPath: "#/properties/dataCustodianEmail/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err79];
            }
            else {
              vErrors.push(err79);
            }
            errors++;
          }
        }
      }
      else {
        const err80 = { instancePath: instancePath + "/dataCustodianEmail", schemaPath: "#/properties/dataCustodianEmail/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err80];
        }
        else {
          vErrors.push(err80);
        }
        errors++;
      }
    }
    if (data.publicVisibility !== undefined) {
      if (typeof data.publicVisibility !== "boolean") {
        const err81 = { instancePath: instancePath + "/publicVisibility", schemaPath: "#/properties/publicVisibility/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err81];
        }
        else {
          vErrors.push(err81);
        }
        errors++;
      }
    }
    if (data.nihAnvilUse !== undefined) {
      let data42 = data.nihAnvilUse;
      if (typeof data42 !== "string") {
        const err82 = { instancePath: instancePath + "/nihAnvilUse", schemaPath: "#/properties/nihAnvilUse/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err82];
        }
        else {
          vErrors.push(err82);
        }
        errors++;
      }
      if (!((((data42 === "I am NHGRI funded and I have a dbGaP PHS ID already") || (data42 === "I am NHGRI funded and I do not have a dbGaP PHS ID")) || (data42 === "I am not NHGRI funded but I am seeking to submit data to AnVIL")) || (data42 === "I am not NHGRI funded and do not plan to store data in AnVIL"))) {
        const err83 = { instancePath: instancePath + "/nihAnvilUse", schemaPath: "#/properties/nihAnvilUse/enum", keyword: "enum", params: { allowedValues: schema32.properties.nihAnvilUse.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err83];
        }
        else {
          vErrors.push(err83);
        }
        errors++;
      }
    }
    if (data.targetDeliveryDate !== undefined) {
      let data43 = data.targetDeliveryDate;
      if (typeof data43 === "string") {
        if (!(formats0.validate(data43))) {
          const err84 = { instancePath: instancePath + "/targetDeliveryDate", schemaPath: "#/properties/targetDeliveryDate/format", keyword: "format", params: { format: "date" }, message: "must match format \"" + "date" + "\"" };
          if (vErrors === null) {
            vErrors = [err84];
          }
          else {
            vErrors.push(err84);
          }
          errors++;
        }
      }
      else {
        const err85 = { instancePath: instancePath + "/targetDeliveryDate", schemaPath: "#/properties/targetDeliveryDate/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err85];
        }
        else {
          vErrors.push(err85);
        }
        errors++;
      }
    }
    if (data.targetPublicReleaseDate !== undefined) {
      let data44 = data.targetPublicReleaseDate;
      if (typeof data44 === "string") {
        if (!(formats0.validate(data44))) {
          const err86 = { instancePath: instancePath + "/targetPublicReleaseDate", schemaPath: "#/properties/targetPublicReleaseDate/format", keyword: "format", params: { format: "date" }, message: "must match format \"" + "date" + "\"" };
          if (vErrors === null) {
            vErrors = [err86];
          }
          else {
            vErrors.push(err86);
          }
          errors++;
        }
      }
      else {
        const err87 = { instancePath: instancePath + "/targetPublicReleaseDate", schemaPath: "#/properties/targetPublicReleaseDate/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err87];
        }
        else {
          vErrors.push(err87);
        }
        errors++;
      }
    }
    if (data.consentGroups !== undefined) {
      let data45 = data.consentGroups;
      if (Array.isArray(data45)) {
        if (data45.length < 1) {
          const err88 = { instancePath: instancePath + "/consentGroups", schemaPath: "#/properties/consentGroups/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err88];
          }
          else {
            vErrors.push(err88);
          }
          errors++;
        }
        const len5 = data45.length;
        for (let i5 = 0; i5 < len5; i5++) {
          if (!(validate29(data45[i5], { instancePath: instancePath + "/consentGroups/" + i5, parentData: data45, parentDataProperty: i5, rootData, dynamicAnchors }))) {
            vErrors = vErrors === null ? validate29.errors : vErrors.concat(validate29.errors);
            errors = vErrors.length;
          }
        }
      }
      else {
        const err89 = { instancePath: instancePath + "/consentGroups", schemaPath: "#/properties/consentGroups/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err89];
        }
        else {
          vErrors.push(err89);
        }
        errors++;
      }
    }
  }
  else {
    const err90 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err90];
    }
    else {
      vErrors.push(err90);
    }
    errors++;
  }
  validate28.errors = vErrors;
  evaluated0.props = props0;
  return errors === 0;
}
validate28.evaluated = { "dynamicProps": true, "dynamicItems": false };
