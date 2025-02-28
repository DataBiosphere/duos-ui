import {DatasetTerm} from '../../types/model';

export interface FiltersTypes {
  accessManagement: string[],
  dataUse: string[],
  dataType: string[],
  dac: string[],
  participantCountMin?: number,
  participantCountMax?: number,
}

export const defaultFilters = (datasets: DatasetTerm[]): FiltersTypes => {
  const defaultParticipantCountValues = generateDefaultParticipantCountValues(datasets);
  return {
    accessManagement: [],
    dataUse: [],
    dataType: [],
    dac: [],
    participantCountMin: defaultParticipantCountValues.min,
    participantCountMax: defaultParticipantCountValues.max,
  };
};

export const generateDefaultParticipantCountValues = (datasets: DatasetTerm[]) => datasets.reduce((acc, dataset) => {
  return {
    max: Math.max(acc.max, dataset.participantCount ?? 0),
    min: Math.min(acc.min, dataset.participantCount ?? Infinity) };
}, {max: 0, min: Infinity});
