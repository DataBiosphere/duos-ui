import { useRef } from 'react';
import isNil from 'lodash/fp/isNil';
import ClearIcon from '@material-ui/icons/Clear';
import { div, input, label, span, h } from 'react-hyperscript-helpers';
import isEmpty from 'lodash/fp/isEmpty';

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

export default function UploadLabelButton(props) {
  const {
    id,
    formAttribute,
    newDULFile = {}, //refers to recently uploaded file (via browser upload, for reference if user cancels a future upload attempt)
    changeDULDocument,
    currentFileName = '', //refers to filename in db record
    currentFileLocation = '' //use to allow user to download current file? (needs to be implemented)
  } = props;

  const fileRef = useRef(props.newDULFile || null);

  const removeUploadLabelHover = (e) => {
    e.target.style.background = uploadFileLabelColors.standardBackgroundColor;
  };

  const applyUploadLabelHover = (e) => {
    e.target.style.background = uploadFileLabelColors.hoverBackgroundColor;
  };

  const removeClearHover = (e) => {
    e.target.style.backgroundColor = fileClearColor.standardColors.backgroundColor;
    e.target.style.color = fileClearColor.standardColors.color;
  };

  const applyClearHover = (e) => {
    e.target.style.backgroundColor = fileClearColor.hoverColors.backgroundColor;
    e.target.style.color = fileClearColor.hoverColors.color;
  };

  //NOTE: File inputs are uncontrolled inputs no matter what
  //Therefore file name updates need to be updated manually via custom click/change handlers
  //Manually clear or assign file names and call parent function to update file on parent's state
  //useRef hook can be used to initialize/update a value for a DOM element while avoiding re-renders on value change
  const clearFile = (changeDULDocument, name) => {
    fileRef.current = null;
    changeDULDocument({name, value: ''});
  };

  const updateFile = (formAttribute, file, fileRef) => {
    if(!isNil(file)) {
      changeDULDocument({name: formAttribute, value: file});
    } else {
      if(!isNil(newDULFile)) {
        fileRef.current.files[0] = newDULFile;
      }
    }
  };

  //NOTE: if the upload add/remove functionality is needed elsewhere, I can pull the label/input out into its own component
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
    cursor: 'pointer',
    fontFamily: 'Roboto, sans-serif',
    fontSize: '1.4rem',
    transition: 'background 0.3s ease',
    margin: 0,
    boxShadow: "-4px 6px 9px 0px #e8e5e5",
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
    backgroundColor: 'rgb(243 248 253)',
    display: 'inline-flex',
    alignItems: 'center',
    borderTopLeftRadius: '2rem',
    borderBottomLeftRadius: '2rem',
    maxWidth: '30rem',
    boxShadow: "-4px 6px 9px 0px #e8e5e5"
  };

  const uploadFileInput = {
    display: 'none'
  };

  const clearIconStyle = {
    backgroundColor: fileClearColor.standardColors.backgroundColor,
    color: fileClearColor.standardColors.color,
    fontSize: '5rem',
    flex: 1,
    borderBottomRightRadius: '2rem',
    borderTopRightRadius: '2rem',
    boxShadow: "-4px 6px 9px 0px #e8e5e5",
    transition: fileClearColor.transition,
    maxWidth: '3rem'
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
        ref: fileRef,
        onChange: (e) => updateFile(formAttribute, e.target.files[0], fileRef)
      }),
      label({
        htmlFor: id,
        style: uploadFileLabel,
        onMouseEnter: applyUploadLabelHover,
        onMouseLeave: removeUploadLabelHover,
      }, ['Upload File']),
      span({
        isRendered: !isNil(newDULFile) || !isEmpty(currentFileName),
        style: filenameStyle
      }, [newDULFile ? newDULFile.name : currentFileName]),
      h(ClearIcon, {
        style: clearIconStyle,
        isRendered: !isNil(newDULFile) || !isEmpty(currentFileName),
        onClick: () => clearFile(changeDULDocument, formAttribute),
        onMouseEnter: applyClearHover,
        onMouseLeave: removeClearHover
      })
    ])
  );
};