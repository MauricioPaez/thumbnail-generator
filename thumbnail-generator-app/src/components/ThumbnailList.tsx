import { ImageList, ImageListItem, IconButton } from "@mui/material";
import * as React from "react";
import { Thumbnail } from "../types";
import DownloadIcon from "@mui/icons-material/Download";

export interface IThumbnailListProps {
  thumbnails: Thumbnail[];
}

export default class ThumbnailList extends React.Component<IThumbnailListProps> {
  downloadImage(image: Thumbnail): void {
    window.open(image.src);
  }

  public render() {
    return (
      <>
        <ImageList cols={1}>
          {this.props.thumbnails.map((thumbnail) => (
            <ImageListItem
              sx={{ width: thumbnail.width, height: thumbnail.height }}
              key={thumbnail.title}
            >
              <div className="absolute left-2 top-2 bg-slate-800 hover:bg-slate-900 text-white rounded-full shadow-md">
                <IconButton
                  color="inherit"
                  aria-label="upload picture"
                  component="span"
                  size={thumbnail.width > 300 ? "large" : "small"}
                  onClick={() => {
                    this.downloadImage(thumbnail);
                  }}
                >
                  <DownloadIcon fontSize="inherit" />
                </IconButton>
              </div>
              <img src={thumbnail.src} alt={thumbnail.title} loading="lazy" />
            </ImageListItem>
          ))}
        </ImageList>
      </>
    );
  }
}
