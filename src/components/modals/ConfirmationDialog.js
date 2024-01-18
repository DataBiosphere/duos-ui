import * as React from 'react';
import Button from "@mui/material/Button";
import { Dialog } from "@mui/material";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import DialogContentText from "@mui/material/DialogContentText";

export const ConfirmationDialog = (props) => {
    const { title, open, close, confirm, description } = props;
    return (
        <Dialog
            open={open}
            onClose={close}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            sx={{ transform: 'scale(1.5)' }}
        >
            <DialogTitle id="alert-dialog-title">
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {description}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={close} variant="outlined">Cancel</Button>
                <Button onClick={confirm} autoFocus color="error" variant="contained">Confirm</Button>
            </DialogActions>
        </Dialog>
    );
}