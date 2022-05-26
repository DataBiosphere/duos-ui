import isNil from 'lodash/fp/isNil';
import ClearIcon from '@material-ui/icons/Clear';
import { div, input, label, a, h } from 'react-hyperscript-helpers';
import isEmpty from 'lodash/fp/isEmpty';
import { isFileEmpty } from '../libs/utils';
import { DAR } from '../libs/ajax';
import { useEffect, useState } from 'react';
import { Notifications } from '../libs/utils';

///Constant styles, not dependent on component variables
const uploadFileLabelColors = {
  standardBackgroundColor: 'rgb(96, 59, 155)',
  hoverBackgroundColor: '#2FA4E7'
};

const fileClearColor = {
  standardColors: {
    backgroundColor: '#fdc3c3ab',
    color: '#fb3737'
  },
  hoverColors: {
    backgroundColor: 'red',
    color: 'white'
  },
  transition: 'background 0.3s ease'
};

const fileNameColor = {
  standardColors: {
    backgroundColor: 'rgb(243 248 253)',
    color: 'black'
  },
  hoverColors: {
    backgroundColor: '#2FA4E7',
    color: 'white'
  },
  transition: 'background 0.3s ease'
};

const filenameStyle = {
  flex: 1,
  justifyContent: 'left',
  whiteSpace: 'nowrap',
  minWidth: '30rem',
  overflow: 'hidden',
  marginLeft: '4rem',
  fontFamily: 'Montserrant',
  fontSize: '1.8rem',
  padding: '0.5rem',
  border: '1px solid #ea5e5',
  cursor: 'pointer',
  backgroundColor: fileNameColor.standardColors.backgroundColor,
  color: fileNameColor.standardColors.color,
  display: 'inline-flex',
  alignItems: 'center',
  borderTopLeftRadius: '2rem',
  borderBottomLeftRadius: '2rem',
  maxWidth: '30rem',
  boxShadow: '-4px 6px 9px 0px #e8e5e5',
  transition: fileNameColor.transition,
};
const uploadFileInput = {
  display: 'none'
};

export default function UploadLabelButton(props) {
  const {
    id,
    formAttribute,
    newDULFile = {}, //refers to recently uploaded file (via browser upload, for reference if user cancels a future upload attempt)
    changeDARDocument,
    currentFileName = '', //refers to filename in db record
    currentFileLocation = '', //use to allow user to download current file? (needs to be implemented),
    darCode,
    referenceId
  } = props;

  const [targetDownload, setTargetDownload] = useState(null);

  useEffect(() => {
    const downloadFile = async() => {
      const fileAttributeLinks = {
        irbDocument: 'irbDocument',
        collaborationLetter: 'collaborationDocument'
      };

      if(!isFileEmpty(newDULFile)) {
        setTargetDownload(URL.createObjectURL(newDULFile));
      } else if(!isNil(currentFileLocation) && !isEmpty(currentFileLocation)) {
        try{
          let targetResponse = await DAR.getDARDocument(referenceId, fileAttributeLinks[formAttribute]);
          const targetFile = new Blob([targetResponse], {type: 'application/octet-stream'});
          if(!isNil(targetFile)) {
            setTargetDownload(URL.createObjectURL(targetFile));
          }
        }catch(error) {
          Notifications.showError({text: 'Error: Failed to retreive saved file'});
        }
      }
    };
    downloadFile();
  }, [currentFileLocation, currentFileName, formAttribute, newDULFile, referenceId]);

  //const styles, dependent on darCode availability
  const uploadFileLabel = {
    flex: 2,
    maxWidth: '10rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: uploadFileLabelColors.standardBackgroundColor,
    color: 'white',
    padding: '1.3rem',
    textAlign: 'center',
    borderRadius: '0.6rem',
    cursor: !darCode ? 'pointer' : 'not-allowed',
    fontFamily: 'Roboto, sans-serif',
    fontSize: '1.4rem',
    transition: 'background 0.3s ease',
    margin: 0,
    boxShadow: '-4px 6px 9px 0px #e8e5e5',
    opacity: darCode ? 0.75 : 1
  };

  const clearIconStyle = {
    backgroundColor: fileClearColor.standardColors.backgroundColor,
    color: fileClearColor.standardColors.color,
    fontSize: '5rem',
    flex: 1,
    borderBottomRightRadius: '2rem',
    borderTopRightRadius: '2rem',
    boxShadow: '-4px 6px 9px 0px #e8e5e5',
    transition: fileClearColor.transition,
    maxWidth: '3rem',
    cursor: !darCode ? 'pointer' : 'not-allowed',
    opacity: darCode ? 0.75 : 1
  };

  const removeUploadLabelHover = (e) => {
    e.target.style.background = uploadFileLabelColors.standardBackgroundColor;
  };

  const applyUploadLabelHover = (e) => {
    e.target.style.background = uploadFileLabelColors.hoverBackgroundColor;
  };

  const removeHoverEffect = (e, targetStyle) => {
    e.target.style.backgroundColor = targetStyle.standardColors.backgroundColor;
    e.target.style.color = targetStyle.standardColors.color;
  };

  const applyHoverEffect = (e, targetStyle) => {
    e.target.style.backgroundColor = targetStyle.hoverColors.backgroundColor;
    e.target.style.color = targetStyle.hoverColors.color;
  };

  //NOTE: File inputs are uncontrolled inputs no matter what
  //Therefore file name updates need to be updated manually via custom click/change handlers
  //Manually clear or assign file names and call parent function to update file on parent's state
  //useRef hook can be used to initialize/update a value for a DOM element while avoiding re-renders on value change
  const clearFile = (changeDARDocument, name) => {
    changeDARDocument({name, value: ''});
  };

  const updateFile = (formAttribute, file) => {
    if(!isNil(file)) {
      changeDARDocument({name: formAttribute, value: file});
    }
  };

  return (
    div({
      style: {
        margin: '0.5rem 0',
        display: 'inline-flex',
        verticalAlign: 'middle'
      }
    }, [
      input({
        id,
        type: 'file',
        style: uploadFileInput,
        disabled: darCode,
        onChange: (e) => !darCode && updateFile(formAttribute, e.target.files[0])
      }),
      label({
        htmlFor: id,
        style: uploadFileLabel,
        onMouseEnter:(e) => !darCode && applyUploadLabelHover(e),
        onMouseLeave:(e) => !darCode && removeUploadLabelHover(e),
      }, ['Upload File']),
      a({
        isRendered: !isFileEmpty(newDULFile) || !isEmpty(currentFileLocation),
        style: filenameStyle,
        onMouseEnter: (e) => applyHoverEffect(e, fileNameColor),
        onMouseLeave: (e) => removeHoverEffect(e, fileNameColor),
        href: targetDownload,
        download: true
      }, [!isFileEmpty(newDULFile) ? newDULFile.name : currentFileName]),
      h(ClearIcon, {
        style: clearIconStyle,
        isRendered: !isFileEmpty(newDULFile) || !isEmpty(currentFileLocation),
        onClick: () => !darCode && clearFile(changeDARDocument, formAttribute),
        onMouseEnter:(e) => !darCode && applyHoverEffect(e, fileClearColor),
        onMouseLeave:(e) => !darCode && removeHoverEffect(e, fileClearColor)
      })
    ])
  );
}
