
import { useEffect } from 'react';
import { a, div, fieldset, h, h3, label, li, ol, ul, p, span} from 'react-hyperscript-helpers';
import isNil from 'lodash/fp/isNil';
import { Alert } from '../../components/Alert';
import { LibraryCardAgreement } from '../../components/LibraryCardAgreement';

const StepAlertTemplate = (props) => {
  const ulLinkStyle = {
    display: 'block',
    fontSize: '1.8rem',
    marginLeft: '7%',
    marginTop: "1.5%"
  };

  return (
    ul({style: ulLinkStyle}, [
      li({isRendered: props.step1Invalid}, [
        a({key: 'step1-alert', onClick: (() => props.goToStep(1))}, ['Step 1'])
      ]),
      li({isRendered: props.step2Invalid}, [
        a({key: 'step2-alert', onClick: (() => props.goToStep(2))}, ['Step 2'])
      ]),
      li({isRendered: props.step3Invalid}, [
        a({key: 'step3-alert', onClick: (() => props.goToStep(3))}, ['Step 3'])
      ])
    ])
  );
};

export default function DataUseAgreements(props) {

  const {
    darCode,
    problemSavingRequest,
    attestAndSave,
    ConfirmationDialogComponent,
    partialSave,
    prevPage,
    step1Invalid,
    step2Invalid,
    step3Invalid,
    updateShowValidationMessages,
    showValidationMessages,
    goToStep
  } = props;

  useEffect(() => {
    const updatedStatus = step1Invalid || step2Invalid || step3Invalid;
    updateShowValidationMessages(updatedStatus);
  }, [updateShowValidationMessages, step1Invalid, step2Invalid, step3Invalid]);

  return (
    div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
      fieldset({ disabled: !isNil(darCode) }, [

        h3({ className: 'rp-form-title access-color' }, ['4.1 Data Use Agreements']),

        div({ className: 'form-group' }, [
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
            label({ className: 'control-label rp-title-question' }, [
              'DUOS Library Card Data Access Agreement & Attestation'
            ])
          ]),

          div({ className: 'row no-margin' }, [
            div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
              span ({ className: 'rp-agreement rp-last-group' }, ['Under the National Institutes of Health (NIH) Genomic Data Sharing Policy, the Genomic Data User Code of Conduct sets forth principles for responsible management and use of large-scale genomic data and associated phenotypic data accessed through controlled access to NIH-designated data repositories (e.g., the database of Genotypes and Phenotypes (dbGaP), repositories established as NIH Trusted Partners). Failure to abide by any term within this Code of Conduct may result in revocation of approved access to datasets obtained through these repositories. Investigators who are approved to access data agree to:']),

              ol({ className: 'rp-agreement rp-last-group' }, [
                li({}, ['Use datasets solely in connection with the research project described in the approved Data Access Request for each dataset']),
                li({}, ['Make no attempt to identify or contact individual participants or groups from whom data were collected, or generate information that could allow participants’ identities to be readily ascertained, without appropriate approvals from the submitting institutions;']),
                li({}, ['Maintain the confidentiality of the data and not distribute them to any entity or individual beyond those specified in the approved Data Access Request;']),
                li({}, ['Adhere to the NIH Security Best Practices for Controlled-Access Data Subject to the NIH Genomic Data Sharing Policy and ensure that only approved users can gain access to data files;']),
                li({}, ['Acknowledge the Intellectual Property terms as specified in the Library Card Agreement; ']),
                li({}, ['Provide appropriate acknowledgement in any dissemination of research findings including the investigator(s) who generated the data, the funding source, accession numbers of the dataset, and the data repository from which the data were accessed; and,']),
                li({}, ['Report any inadvertent data release, breach of data security, or other data management incidents in accordance with the terms specified in the Library Card Agreement. ']),
              ])
            ]),

            div({ className: 'row no-margin' }, [
              h3({ className: 'rp-form-title access-color' }, ['Data Access Agreement(s)']),
            ]),

            div({ className: 'row no-margin' }, [
              div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                label({ className: 'control-label default-color' }, [
                  "By submitting this data access request, you agree to all terms in the agreement(s) listed below"
                ])
              ]),

              div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                LibraryCardAgreement
              ]),
            ])
          ]),

          div({ className: 'row no-margin' }, [
            div({ isRendered: showValidationMessages, className: 'rp-alert' }, [
              Alert({
                id: 'formErrors',
                type: 'danger',
                title: 'Please, complete all required fields for the following steps:',
                description: h(StepAlertTemplate, {step1Invalid, step2Invalid, step3Invalid, goToStep})
              })
            ]),

            div({ isRendered: problemSavingRequest, className: 'rp-alert' }, [
              Alert({
                id: 'problemSavingRequest', type: 'danger',
                title: 'Some errors occurred, Data Access Request Application couldn\'t be created.'
              })
            ])
          ])
        ])
      ]),

      div({ className: 'row no-margin' }, [
        div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
          a({ id: 'btn_prev', onClick: prevPage, className: 'f-left btn-primary access-background' }, [
            span({ className: 'glyphicon glyphicon-chevron-left', 'aria-hidden': 'true' }), 'Previous Step'
          ]),

          a({
            id: 'btn_submit', isRendered: isNil(darCode), onClick: attestAndSave,
            className: 'f-right btn-primary access-background bold'
          }, ['Attest and Send']),
          ConfirmationDialogComponent,
          a({
            id: 'btn_save', isRendered: isNil(darCode), onClick: partialSave,
            className: 'f-right btn-secondary access-color'
          }, ['Save'])
        ])
      ])
    ])
  );
}
