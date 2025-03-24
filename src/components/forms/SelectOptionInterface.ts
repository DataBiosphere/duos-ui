export interface SelectOptionWithKeyNameAndAbbreviation {
    key: string,
    name: string,
    abbreviation?: string
}

export type SelectEntry = {
    key: string;
    displayText: string;
}

export function getFormattedName(entry: SelectOptionWithKeyNameAndAbbreviation): string {
    if (entry.abbreviation && entry.name) {
        return `${entry.name} (${entry.abbreviation})`;
    }

    return entry.name;
}

export function asIdAndDisplayText(entryList: SelectOptionWithKeyNameAndAbbreviation[]): SelectEntry[] {
    return entryList.map((entry) => ({displayText: getFormattedName(entry), key: entry.key} as SelectEntry));
}
