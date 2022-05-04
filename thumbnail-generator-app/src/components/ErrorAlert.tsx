import * as React from "react";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export interface IErrorAlertProps {
  errorMessage: string;
  onClearError: () => void;
}

export default class ErrorAlert extends React.Component<IErrorAlertProps> {
  public render() {
    return (
      <div>
        <div className="my-4 inline-block rounded shadow-md bg-red-500 hover:bg-red-600 font-semibold text-xl text-white max-w-lg">
          <Stack direction="row" spacing={1}>
            <Typography p={2}>{this.props.errorMessage}</Typography>
            <IconButton
              color="inherit"
              aria-label="clear"
              onClick={this.props.onClearError}
            >
              <CloseOutlinedIcon />
            </IconButton>
          </Stack>
        </div>
      </div>
    );
  }
}
