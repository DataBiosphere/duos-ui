import { Component } from 'react';
import { div, hr, label, hh, ul } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { DataSet, Consent } from '../../libs/ajax';
import { GenerateUseRestrictionStatements } from '../TranslatedDULComponent';

export const DatasetSummaryModal = hh(class DatasetSummaryModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      datasetId: '',
      datasetName: '',
      description: '',
      dataType: '',
      phenotype: '',
      species: '',
      nrParticipants: '',
      dataDepositor: '',
      pi: '',
      consentName: '',
      dataUse: {},
      translatedDULStatements: []
    };

    this.closeHandler = this.closeHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
  }

  componentDidMount() {
    this.getSummaryInfo();
  }

  async getSummaryInfo() {
    const dataSet = await DataSet.getDataSetsByDatasetId(this.props.dataSetId);
    const consent = await Consent.findConsentById(dataSet.consentId);
    const translatedDULStatements = await GenerateUseRestrictionStatements(consent.dataUse);

    this.setState(property => {
      property.datasetName = dataSet.properties[0].propertyValue;
      property.datasetId = dataSet.alias;
      property.dataType = dataSet.properties[2].propertyValue;
      property.species = dataSet.properties[3].propertyValue;
      property.phenotype = dataSet.properties[4].propertyValue;
      property.nrParticipants = dataSet.properties[5].propertyValue;
      property.description = dataSet.properties[6].propertyValue;
      property.dataDepositor = dataSet.properties[8].propertyValue;
      property.pi = dataSet.properties[9].propertyValue;
      property.consentName = consent.name;
      property.dataUse = consent.dataUse;
      property.loading = false;
      property.translatedDULStatements = translatedDULStatements;
      return property;
    });
  }

  handleOverwriteChange(event) {
    this.setState({
      file: this.state.file,
      overwrite: event.target.checked
    });
  }

  handleFileChange(event) {
    if (event.target.files !== undefined && event.target.files[0]) {
      let file = event.target.files[0];
      this.setState({
        file: file,
        overwrite: this.state.overwrite
      });
    }
  }

  OKHandler() {
    this.props.onOKRequest('datasetSummaryModal');
  }

  closeHandler() {
    this.props.onCloseRequest('datasetSummaryModal');
  }


  render() {
    const { loading } = this.state;
    if (loading) {
      return null;
    }
    return (

      BaseModal({
        id: 'datasetSummaryModal',
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        color: 'dataset',
        type: 'informative',
        iconSize: 'none',
        title: 'Dataset Summary',
        description: 'Requested Dataset Information',
        action: { label: 'Close', handler: this.OKHandler }
      },
      [
        div({ className: 'summary' }, [
          div({ className: 'row' }, [
            label({ id: 'lbl_datasetId', className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color' }, ['Dataset ID']),
            div({ id: 'txt_datasetId', className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label' }, [this.state.datasetId]),
          ]),

          div({ className: 'row' }, [
            label({ id: 'lbl_datasetName', className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color' }, ['Dataset Name']),
            div({ id: 'txt_datasetName', className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label' }, [this.state.datasetName]),
          ]),

          div({ className: 'row' }, [
            label({ id: 'lbl_description', className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color' }, ['Description']),
            div({ id: 'txt_description', className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label' }, [this.state.description]),
          ]),

          div({ className: 'row' }, [
            label({ id: 'lbl_dataType', className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color' }, ['Data Type']),
            div({ id: 'txt_dataType', className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label' }, [this.state.dataType]),
          ]),

          div({ className: 'row' }, [
            label({ id: 'lbl_phenotype', className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color' }, ['Phenotype/Indication']),
            div({ id: 'txt_phenotype', className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label' }, [this.state.phenotype]),
          ]),

          div({ className: 'row' }, [
            label({ id: 'lbl_species', className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color' }, ['Species']),
            div({ id: 'txt_species', className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label' }, [this.state.species]),
          ]),

          div({ className: 'row' }, [
            label({ id: 'lbl_participants', className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color' }, ['# of Participants']),
            div({ id: 'txt_participants', className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label' }, [this.state.nrParticipants]),
          ]),

          hr({}),

          div({ className: 'row' }, [
            label({ id: 'lbl_depositor', className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color' }, ['Data Depositor']),
            div({ id: 'txt_depositor', className: 'col-lg-3 col-md-3 col-sm-9 col-xs-8 response-label' }, [this.state.dataDepositor]),
          ]),

          div({ className: 'row' }, [
            label({ id: 'lbl_PI', className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color' }, ['Principal Investigator']),
            div({ id: 'txt_PI', className: 'col-lg-3 col-md-3 col-sm-9 col-xs-8 response-label' }, [this.state.pi]),
          ]),

          hr({}),

          div({ className: 'row' }, [
            label({ id: 'lbl_consentId', className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color' }, ['Consent ID']),
            div({ id: 'txt_consentId', className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label' }, [this.state.consentName]),
          ]),

          div({ className: 'row' }, [
            label({ id: 'lbl_structured', className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label dataset-color' }, ['Structured Limitations']),
            div({className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label'}, [
              ul({style: {listStyleType: 'none', padding: 0, margin: 0}, }, this.state.translatedDULStatements)
            ])
          ])
        ])
      ])
    );
  }
});
