import {div, h, hh, textarea} from 'react-hyperscript-helpers';
import {RadioButton} from '../../components/RadioButton';
import {Component} from 'react';
import AsyncSelect from 'react-select/async/dist/react-select.esm';
import {DAR} from '../../libs/ajax';
import * as fp from 'lodash/fp';

export const TypeOfResearch = hh(class TypeOfResearch extends Component {

  searchOntologies = (query, callback) => {
    let options = [];
    DAR.getAutoCompleteOT(query).then(
      items => {
        options = items.map(function(item) {
          return {
            key: item.id,
            value: item.id,
            label: item.label,
            item: item,
          };
        });
        callback(options);
      });
  };

  render() {
    const props = this.props;
    const ontologies = props.ontologies.map(ontology => {
      ontology.id = ontology.id || ontology.item.id;
      ontology.key = ontology.id;
      return ontology;
    });
    let otherTextStyle = {
      borderRadius: 4,
      boxShadow: 'inset 0 1px 1px rgba(0,0,0,.075)',
      border: '1px solid #999',
      backgroundColor: '#eee',
      padding: '6px 12px',
      width: '100%',
    };
    if (props.other) {
      otherTextStyle = fp.merge(otherTextStyle, {backgroundColor: '#fff'});
    } else {
      otherTextStyle = fp.merge(otherTextStyle, {cursor: 'not-allowed'});
    }

    let ontologySelectionStyle = {};
    if (!props.diseases) {
      ontologySelectionStyle = fp.merge(ontologySelectionStyle, {
        control: styles => ({
          ...styles,
          border: '1px solid #999',
          backgroundColor: '#eee',
          cursor: 'not-allowed',
        }),
      });
    }

    return (
      div({},
        [
          RadioButton({
            style: {
              marginBottom: '2rem',
              color: '#777',
            },
            id: 'checkHmb',
            name: 'checkPrimary',
            value: 'hmb',
            defaultChecked: props.hmb,
            onClick: props.hmbHandler,
            label: '2.3.1 Health/medical/biomedical research: ',
            description: 'The primary purpose of the study is to investigate a health/medical/biomedical (or biological) phenomenon or condition.',
            disabled: props.disabled,
          }),

          RadioButton({
            style: {
              marginBottom: '2rem',
              color: '#777',
            },
            id: 'checkPoa',
            name: 'checkPrimary',
            value: 'poa',
            defaultChecked: props.poa,
            onClick: props.poaHandler,
            label: '2.3.2 Population origins or ancestry research: ',
            description: 'The outcome of this study is expected to provide new knowledge about the origins of a certain population or its ancestry.',
            disabled: props.disabled,
          }),

          RadioButton({
            style: {
              marginBottom: '2rem',
              color: '#777',
            },
            id: 'checkDisease',
            name: 'checkPrimary',
            value: 'poa',
            defaultChecked: props.diseases,
            onClick: props.diseasesHandler,
            label: '2.3.3 Disease-related studies: ',
            description: 'The primary purpose of the research is to learn more about a particular disease or disorder (e.g., type 2 diabetes), a trait (e.g., blood pressure), or a set of related conditions (e.g., autoimmune diseases, psychiatric disorders).',
            disabled: props.disabled,
          }),

          div({
            style: {
              marginBottom: '2rem',
              color: '#777',
            },
          },
          ['If you selected Disease-related Studies, please select the disease area(s) this study focuses on in the box below.']),

          div({
            style: {
              marginBottom: '2rem',
              color: '#777',
              cursor: props.diseases ? 'pointer' : 'not-allowed',
            },
          }, [
            h(AsyncSelect, {
              styles: ontologySelectionStyle,
              id: 'sel_diseases',
              isDisabled: !props.diseases,
              isMulti: true,
              loadOptions: (query, callback) => this.searchOntologies(query, callback),
              onChange: (option) => props.ontologiesHandler(option),
              value: ontologies,
              placeholder: 'Please enter one or more diseases',
              classNamePrefix: 'select',
            }),
          ]),

          RadioButton({
            style: {
              marginBottom: '2rem',
              color: '#777',
            },
            id: 'checkOther',
            name: 'checkPrimary',
            value: 'other',
            defaultChecked: props.other,
            onClick: props.otherHandler,
            label: '2.3.4 Other:',
            description: '',
            disabled: props.disabled,
          }),

          textarea({
            style: otherTextStyle,
            value: props.otherText,
            onChange: props.otherTextHandler,
            name: 'otherText',
            id: 'otherText',
            maxLength: '512',
            rows: '2',
            required: props.other,
            placeholder: 'Please specify if selected (max. 512 characters)',
            disabled: props.disabled || !props.other,
          }),

        ])
    );
  }

});
