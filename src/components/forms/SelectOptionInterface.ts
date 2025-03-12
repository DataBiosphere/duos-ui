import {SelectEntry} from "src/components/forms/SelectOptions";

export interface SelectOptionWithKeyNameAndAbbreviation {
    key: string,
    name?: string,
    abbreviation?: string
}

export function getFormattedName(entry: SelectOptionWithKeyNameAndAbbreviation) {
    if (entry.abbreviation && entry.name) {
        return `${entry.name} (${entry.abbreviation})`;
    }
    if (entry.name) {
        return `${entry.name}`;
    }
    return `${entry.key}`
}

export function asIdAndDisplayText(entryList: SelectOptionWithKeyNameAndAbbreviation[]): SelectEntry[] {
    return entryList.map((entry) => ({displayText: getFormattedName(entry), key: entry.key} as SelectEntry));
}