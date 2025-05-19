import {Presentation} from "src/types/model";

export interface FormState {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface FormFieldChange {
    key: string;
    value: boolean | string;
}

// Question: Should I just change the other "Publication" interface to match this?
export interface ExpectedPublication {
    title: string,
    pubmedId: string,
    date: string,
    authors: string,
    bibliographicCitation: string,
    datasetCitation: string,
    citation: boolean
}

export interface ExpectedFormState {
    progressReportSummary?: string;
    intellectualPropertyYesNo?: boolean;
    intellectualPropertySummary?: string;
    publications?: ExpectedPublication[];
    presentations?: Presentation[];
}
