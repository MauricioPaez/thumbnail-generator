import * as React from "react";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { IconButton, Stack, Typography } from "@mui/material";

export interface IFileChipProps {
  file: File;
  onClearFile: () => void;
  disabled: boolean;
}

export default class FileChip extends React.Component<IFileChipProps> {
  public render() {
    return (
      <div className="my-4">
        <Stack direction="row" spacing={1}>
          <div className="flex rounded shadow-md font-semibold text-xl text-white max-w-lg bg-teal-800 hover:bg-teal-900">
            <Typography p={2}>{this.props.file.name}</Typography>
            <IconButton
              color="inherit"
              aria-label="clear"
              onClick={this.props.onClearFile}
              disabled={this.props.disabled}
            >
              <CloseOutlinedIcon />
            </IconButton>
          </div>
        </Stack>
      </div>
    );
  }
}
