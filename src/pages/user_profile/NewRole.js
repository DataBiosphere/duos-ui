import { useState } from 'react';
import { div, h, h2, button } from 'react-hyperscript-helpers';
import { Support } from '../../libs/ajax';
import { Notifications } from '../../libs/utils';
import { FormField, FormFieldTypes } from '../../components/forms/forms';

export default function NewRole(props) {

  const {
    profile
  } = props;

  const headerStyle = {
    fontWeight: 'bold',
    color: '#333F52',
    fontSize: '16px',
    marginTop: '1.5rem',
    marginBottom: '1rem'
  };

  const possibleSupportRequests = [
    {
      key: 'checkRegisterDataset',
      label: 'Register a dataset'
    },
    {
      key: 'checkRequestDataAccess',
      label: 'Request access to data',
    },
    {
      key: 'checkSOPermissions',
      label: `I am a Signing Official and I want to issue permissions to my institution's users`
    },
    {
      key: 'checkJoinDac',
      label: 'I am looking to join a DAC'
    }
  ];

  const [supportRequests, setSupportRequests] = useState({
    checkRegisterDataset: false,
    checkRequestDataAccess: false,
    checkSOPermissions: false,
    checkJoinDac: false,
    extraRequest: undefined
  });

  const handleSupportRequestsChange = ({ key, value }) => {
    let newSupportRequests = Object.assign({}, supportRequests, { [key]: value });
    setSupportRequests(newSupportRequests);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    await sendSupportRequests();
  };

  const processSupportRequests = () => {
    const filteredRequests = possibleSupportRequests.filter(request => supportRequests[request.key]);
    return [
      filteredRequests.length > 0,
      filteredRequests
        .map(x => `- ${x.label}`)
        .join('\n')
    ];
  };

  const sendSupportRequests = async () => {
    const [hasSupportRequests, requestText] = processSupportRequests();

    // if there are no supportRequests, don't create a new support ticket
    if (!hasSupportRequests) {
      return;
    }

    const ticketInfo = {
      attachmentToken: [],
      type: 'task',
      subject: `DUOS: User Request for ${profile.profileName}`,
      description: `User (${profile.id}, ${profile.email}) has selected the following options:\n`
        + requestText
        + (supportRequests.extraRequest ? `\n- ${supportRequests.extraRequest}` : '')
    };

    const ticket = Support.createTicket(
      profile.profileName, ticketInfo.type, profile.email,
      ticketInfo.subject,
      ticketInfo.description,
      ticketInfo.attachmentToken,
      'User Profile Page'
    );

    const response = await Support.createSupportRequest(ticket);
    if (response.status === 201) {
      Notifications.showSuccess(
        { text: 'Sent Requests Successfully', layout: 'topRight', timeout: 1500 }
      );
    } else {
      Notifications.showError({
        text: `ERROR ${response.status} : Unable To Send Requests`,
        layout: 'topRight',
      });
    }
  };

  // useEffect(() => {
  //   const init = async () => {
  //     try {
  //       if (!isNil(profile)) {

  //       }
  //     } catch (error) {
  //       Notifications.showError({ text: 'Error: Unable to load page' });
  //     }
  //   };

  //   init();
  // }, [profile]);

  return div({}, [
    div({
      style: {
        backgroundColor: '#F2F2F2',
        padding: 25,
        marginTop: 40
      }
    }, [
      h2({
        id: 'lbl_supportRequests',
        style: { ...headerStyle, marginTop: 0 },
      }, ['Which of the following are you looking to do?*']),
      possibleSupportRequests.map(supportRequest => {
        return h(FormField, {
          toggleText: supportRequest.label,
          type: FormFieldTypes.CHECKBOX,

          key: supportRequest.key,
          id: supportRequest.key,
          onChange: handleSupportRequestsChange,
        });
      }),
      div({
        isRendered: supportRequests.checkRequestDataAccess,
        style: {
          border: '1px solid purple', color: 'purple', padding: '10px'
        }
      }, [
        'Before you can submit a data access request, your Signing Official must register and issue you a Library Card in DUOS'
      ]),
      div({ style: { margin: '15px 0 10px' } }, [
        `Is there anything else you'd like to request?`
      ]),
      h(FormField, {
        type: FormFieldTypes.TEXTAREA,
        id: 'extraRequest',
        placeholder: 'Enter your request',
        maxLength: '512',
        rows: '3',
        onChange: handleSupportRequestsChange,
      }),
    ]),

    button({
      id: 'btn_submit',
      onClick: submitForm,
      className: 'f-right btn-primary common-background',
      style: {
        marginTop: '50px',
      },
    }, ['Submit']),
    div({ className: '', style: { 'marginTop': '100px' } }, []),
  ])
    ;

}
