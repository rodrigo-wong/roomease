import * as React from "react";
import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { Input } from "@mui/material";
import { router } from "@inertiajs/react";
import { Label } from "@mui/icons-material";

const ContractorRoles = () => {
    const [open, setOpen] = useState(false);
    const [role, setRole] = useState("");
    const [description, setDescription] = useState("");
    const [rate, setRate] = useState(0);

    const handleCreateRole = () => {
        router.post(
            route("contractor.role.store"),
            {
                name: role,
                description: description,
                rate: rate,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setOpen(false);
                    setRole("");
                    setDescription("");
                    setRate(0);
                },
            }
        );
    };

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setCategory("");
        setOpen(false);
    };

    return (
        <React.Fragment>
            <Button variant="outlined" onClick={handleClickOpen}>
                + Add Role
            </Button>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Add a new role"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        <div>
                            <Label>Role Name</Label>
                            <Input
                                type="text"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder="Role Name"
                            />
                        </div>
                        <div>
                            <Label>Role Description</Label>
                            <Input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Role Description"
                            />
                        </div>
                        <div>
                            <Label>Role Rate</Label>
                            <Input
                                type="number"
                                value={rate}
                                onChange={(e) => setRate(e.target.value)}
                                placeholder="Role Rate"
                            />
                        </div>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleCreateRole} autoFocus>
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
};

export default ContractorRoles;
