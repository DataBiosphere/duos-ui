export const DarValidationMessages = (props) => {

  const {
    validationMessages,
    showValidationMessages,
  } = props;

  return div({
    isRendered: showValidationErrors,
  },
    validationErrors.map((err, idx) => {
      return div({style: {marginBottom: '2rem'}}, [
        h(Notification,
          {
            key: idx,
            notificationData: {
              level: 'danger',
              message: err,
            }
          }),
      ]);
    }),
  );
};

export default DarValidationMessages;