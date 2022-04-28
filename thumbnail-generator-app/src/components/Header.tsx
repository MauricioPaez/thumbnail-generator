import { Typography } from "@mui/material";
import * as React from "react";

export interface IHeaderProps {
  title: string;
}

export default class Header extends React.Component<IHeaderProps> {
  public render() {
    return (
      <header className="text-white py-2 bg-slate-900 text-center">
        <Typography variant="h3">{this.props.title}</Typography>
      </header>
    );
  }
}
