import * as React from "react";
import UploadImage from "./UploadImage";

export interface IPageLayoutProps {}

export default class PageLayout extends React.Component<IPageLayoutProps> {
  public render() {
    return (
      <div className="w-full sm:h-screen h-auto bg-gradient-to-r from-slate-900 to-cyan-800">
        <UploadImage />
      </div>
    );
  }
}
