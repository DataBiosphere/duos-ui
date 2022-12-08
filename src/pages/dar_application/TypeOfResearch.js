import {div, h, hh, textarea, label, input, span} from 'react-hyperscript-helpers';
import {RadioButton} from '../../components/RadioButton';
import {Component} from 'react';
import AsyncSelect from 'react-select/async';
import {DAR} from '../../libs/ajax';
import * as fp from 'lodash/fp';

const radioButtonStyle = {
  marginBottom: '2rem',
  color: '#777',
};

const diseaseLabel = {
  fontWeight: 800,
  color: '#777777',
  float: 'left',
  marginLeft: '2rem'
};

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

  optionEventHandler = (e, optionHandler) => {
    optionHandler(e);
  };

  render() {
    const props = this.props;
    const hmb = props.diseases ? true : this.props.hmb;
    const ontologies = props.ontologies.map(ontology => {
      //minor processing step to ensure id and key are on ontology so that AsyncSelect does not break
      //done as a preventative measure for previously saved ontologies (prior to DUOS-718 PR)
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
      width: '100%'
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
      div({className: 'radio-questions-container'},
        [
          RadioButton({
            style: fp.merge(radioButtonStyle, {marginBottom: hmb ? 0 : '2rem'}),
            id: 'checkHmb',
            name: 'checkPrimary',
            value: 'hmb',
            defaultChecked: (hmb || this.props.diseases),
            onClick: props.hmbHandler,
            label: '2.3.1 Health/medical/biomedical research: ',
            description: 'The primary purpose of the study is to investigate a health/medical/biomedical (or biological) phenomenon or condition.',
            disabled: props.disabled,
          }),

          div({
            isRendered: hmb,
            className: 'row no-margin'
          },[
            div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12', style: {marginBottom: '1.5rem'}}, [
              span({className: 'control-label rp-choice-questions'}, [
                div({style: {marginLeft: '2rem', color: 'rgb(96, 59, 155)'}}, 'Are you studying any specific disease(s)?'),
                fp.map.convert({cap: false})((boolVal, option) => {
                  return label({
                    key: `check-diseases-option-${option}`,
                    className: 'control-label',
                    //!important is needed since rp-choice-questions has an !important tag
                    //NOTE: try to review css and see if !important can be removed. Inline style eliminates the need for it
                    style: diseaseLabel
                  }, [
                    input({
                      type: 'radio',
                      id: 'checkDiseases',
                      value: boolVal ? boolVal : undefined, //value on inputs is always a string, need to ensure booleans from props are processed correctly
                      name: 'diseases',
                      checked: props.diseases === !!boolVal,
                      onChange: props.diseasesHandler,
                      disabled: props.disabled,
                      style: {marginRight: '1rem'}
                    }),
                    option
                  ]);
                })({'Yes': true, 'No': false})
              ])
            ]),

            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-sx-12 ',
              isRendered: props.diseases,
              style: {
                marginLeft: '2rem',
                marginBottom: '2rem'
              }
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
                classNamePrefix: 'select'
              })
            ])
          ]),

          RadioButton({
            style: radioButtonStyle,
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
            id: 'checkOther',
            name: 'checkPrimary',
            value: 'other',
            defaultChecked: props.other,
            onClick: props.otherHandler,
            label: '2.3.3 Other:',
            description: '',
            disabled: props.disabled,
          }),

          textarea({
            isRendered: props.other,
            style: otherTextStyle,
            value: props.otherText,
            onChange: props.otherTextHandler,
            name: 'otherText',
            id: 'otherText',
            maxLength: '512',
            rows: '2',
            required: props.other,
            placeholder: 'Please specify if selected (max. 512 characters)',
            disabled: props.disabled
          })
        ])
    );
  }

});
