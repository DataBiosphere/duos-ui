import {SelectOptionWithKeyNameAndAbbreviation} from './SelectOptionInterface';

export class ResearchStage {
    static PRA: SelectOptionWithKeyNameAndAbbreviation = {key: 'PRA', name: 'Pre-analysis'};
    static POA: SelectOptionWithKeyNameAndAbbreviation = {key: 'POA', name: 'Post-analysis'};
    static INA: SelectOptionWithKeyNameAndAbbreviation = {key: 'INA', name: 'Intra-analysis'}
    static VALUES: SelectOptionWithKeyNameAndAbbreviation[] = [
        ResearchStage.PRA,
        ResearchStage.POA,
        ResearchStage.INA
    ]
}
