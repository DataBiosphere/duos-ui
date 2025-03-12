import React from 'react'
import {mount} from 'cypress/react'
import {FormField, FormFieldTypes} from '../../../src/components/forms/forms';
import {asIdAndDisplayText, getFormattedName} from '../../../src/components/forms/SelectOptionInterface';
import {StudyType} from '../../../src/components/forms/StudyType';
import {SecondaryDataUseTerms} from '../../../src/components/forms/SecondaryDataUseTerms';
import {NIHInstitutesAndCenters} from '../../../src/components/forms/NIHInstitutesAndCenters';
import {DataTypes} from '../../../src/components/forms/DataTypes';

describe('SelectOptions tests', () => {
    describe('Loads a list of study options', () => {
        it('should load a list of Study Type with options populated', () => {
            const props = {
                onChange: () => {
                },
                id: 'studyType',
                title: 'Study Type',
                type: FormFieldTypes.SELECT,
                selectOptions: asIdAndDisplayText(StudyType.studyTypeList),
                isMulti: true
            };
            cy.spy(props, 'onChange');

            mount(<FormField {...props}/>);
            cy.get('#studyType').type('Obs{enter}');
            cy.get('#studyType').then(() => {
                expect(props.onChange).to.be.calledWith({
                    key: 'studyType',
                    value: [{key: StudyType.OBS.key, displayText: StudyType.OBS.name}],
                    isValid: true
                });
            });
        });
        it('should load a list of Secondary Data Use Terms with options populated', () => {
            const props = {
                onChange: () => {
                },
                id: 'secondaryDataUse',
                title: 'Secondary Data Use',
                type: FormFieldTypes.SELECT,
                selectOptions: asIdAndDisplayText(SecondaryDataUseTerms.secondaryDataUseTermsList),
                isMulti: true
            };
            cy.spy(props, 'onChange');

            mount(<FormField {...props}/>);
            cy.get('#secondaryDataUse').type('Genetic{enter}');
            cy.get('#secondaryDataUse').then(() => {
                expect(props.onChange).to.be.calledWith({
                    key: 'secondaryDataUse',
                    value: [{key: SecondaryDataUseTerms.GSO.key, displayText: getFormattedName(SecondaryDataUseTerms.GSO)}],
                    isValid: true
                });
            });
        });
        it('should load a list of NIH Institutes And Centers with options populated', () => {
            const props = {
                onChange: () => {
                },
                id: 'nihCenters',
                title: 'NIH Institutes And Centers',
                type: FormFieldTypes.SELECT,
                selectOptions: asIdAndDisplayText(NIHInstitutesAndCenters.nihInstitutesAndCentersList),
                isMulti: true
            };
            cy.spy(props, 'onChange');

            mount(<FormField {...props}/>);
            cy.get('#nihCenters').type('Eye{enter}');
            cy.get('#nihCenters').then(() => {
                expect(props.onChange).to.be.calledWith({
                    key: 'nihCenters',
                    value: [{key: NIHInstitutesAndCenters.NEI.key, displayText: getFormattedName(NIHInstitutesAndCenters.NEI)}],
                    isValid: true
                });
            });
        });
        it('should load a list of Data Types with options populated', () => {
            const props = {
                onChange: () => {
                },
                id: 'dataTypes',
                title: 'Data Types',
                type: FormFieldTypes.SELECT,
                selectOptions: asIdAndDisplayText(DataTypes.dataTypesList),
                isMulti: true
            };
            cy.spy(props, 'onChange');

            mount(<FormField {...props}/>);
            cy.get('#dataTypes').type('WGS{enter}');
            cy.get('#dataTypes').then(() => {
                expect(props.onChange).to.be.calledWith({
                    key: 'dataTypes',
                    value: [{key: DataTypes.WGS.key, displayText: getFormattedName(DataTypes.WGS)}],
                    isValid: true
                });
            });
        });
    });
})
