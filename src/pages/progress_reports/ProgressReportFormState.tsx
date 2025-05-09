export interface FormState {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface FormFieldChange {
    key: string;
    value: boolean | string;
}
