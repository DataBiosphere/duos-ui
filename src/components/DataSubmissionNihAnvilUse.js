import {div, h} from "react-hyperscript-helpers";
import {RadioButton} from "./RadioButton";

const I_DID = 'I did';
const I_WILL = 'I will';
const NO = 'No';

function dbGapForm(props) {

  return div([



  ])
}


export default function DataSubmissionNihAnvilUse(props) {
  const { updateFormData, formData } = props;


  const submittingToAnvilRequired = ({nilAnvilUse = ''}) => {
    return nilAnvilUse === I_WILL || nilAnvilUse === NO;
  };

  return div([
    div(['NIH and AnVIL use']),
    div([
      'Will you or did you submit data to the NIH?*',

      RadioButton({
        id: 'nihAnvilUseIDid',
        name: 'nihAnvilUseIDid',
        value: 'nihAnvilUseIDid',
        defaultChecked: formData.nihAnvilUse === I_DID,
        onClick: () => updateFormData({
          nihAnvilUse: I_DID,
          submittingToAnvil: null
        }),
        description: I_DID
      }),

      RadioButton({
        id: 'nihAnvilUseIWill',
        name: 'nihAnvilUseIWill',
        value: 'nihAnvilUseIWill',
        defaultChecked: formData.nihAnvilUse === I_WILL,
        onClick: () => updateFormData({
          nihAnvilUse: I_WILL
        }),
        description: I_WILL
      }),

      RadioButton({
        id: 'nihAnvilUseNo',
        name: 'nihAnvilUseNo',
        value: 'nihAnvilUseNo',
        defaultChecked: formData.nihAnvilUse === NO,
        onClick: () => updateFormData({
          nihAnvilUse: NO
        }),
        description: NO
      })

    ]),
    div(
      {
        isRendered: submittingToAnvilRequired({nilAnvilUse: formData.nilAnvilUse})
      },
      [
        'Are you planning to submit to AnVIL?*',

        RadioButton({
          id: 'submittingToAnvilYes',
          name: 'submittingToAnvilYes',
          value: 'submittingToAnvilYes',
          defaultChecked: formData.submittingToAnvil === true,
          onClick: () => updateFormData({
            submittingToAnvil: true
          }),
          description: 'Yes'
        }),

        RadioButton({
          id: 'submittingToAnvilNo',
          name: 'submittingToAnvilNo',
          value: 'submittingToAnvilNo',
          defaultChecked: formData.submittingToAnvil === false,
          onClick: () => updateFormData({
            submittingToAnvil: false
          }),
          description: 'No'
        })

      ]),

    h(dbGapForm, {isRendered: formData.nihAnvilUse === I_DID})
  ]);
}