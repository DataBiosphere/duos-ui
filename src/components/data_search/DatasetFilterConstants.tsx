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

export const generateDefaultParticipantCountValues = (datasets: DatasetTerm[]) => {
  return {
    max: datasets.reduce((max, dataset) => Math.max(max, dataset.participantCount ? dataset.participantCount : 0), 0),
    min: 0
  };
}
