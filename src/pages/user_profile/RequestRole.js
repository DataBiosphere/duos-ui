import { useState } from 'react';
import { div, h, h2, p, button } from 'react-hyperscript-helpers';
import { Support } from '../../libs/ajax';
import { Notifications } from '../../libs/utils';
import { isNil } from 'lodash';
import { FormField, FormFieldTypes } from '../../components/forms/forms';

export default function RequestRole(props) {

  const profile = props.location.state?.data || undefined;

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

  const goToPrevPage = async (event) => {
    event.preventDefault();
    await props.history.push('/user_profile');
  };

  const handleSupportRequestsChange = ({ key, value }) => {
    let newSupportRequests = Object.assign({}, supportRequests, { [key]: value });
    setSupportRequests(newSupportRequests);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!isNil(profile)) {
      await sendSupportRequests();
    }
  };


  const processSupportRequests =
    () => {
      const filteredRequests = possibleSupportRequests.filter(request => supportRequests[request.key]);
      return [
        filteredRequests.length > 0,
        filteredRequests
          .map(x => `- ${x.label}`)
          .join('\n')
      ];
    };

  const sendSupportRequests =
    async () => {
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

  return div({
    style: {
      padding: '25px 270px 0px 270px'
    }
  }, [
    p({
      style: {
        color: '#01549F',
        fontFamily: 'Montserrat',
        fontSize: '20px',
        fontWeight: '600',
        marginTop: 10
      }
    }, ['Request a New Role in DUOS']),
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
      id: 'btn_save',
      onClick: goToPrevPage,
      className: 'f-left btn-primary btn-back',
      style: {
        marginTop: '50px',
      },
    }, ['Back']),
    button({
      id: 'btn_save',
      onClick: submitForm,
      className: 'f-right btn-primary common-background',
      style: {
        marginTop: '50px',
      },
    }, ['Submit']),
  ]);
}