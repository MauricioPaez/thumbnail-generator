import axios from "axios";
import React from "react";

import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import AspectRatioIcon from "@mui/icons-material/AspectRatio";
import ClearIcon from "@mui/icons-material/Clear";
import CloudDownloadOutlinedIcon from "@mui/icons-material/CloudDownloadOutlined";
import ImageIcon from "@mui/icons-material/Image";
import PhotoSizeSelectLargeIcon from "@mui/icons-material/PhotoSizeSelectLarge";
import {
  Button,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

import { Thumbnail } from "../types";
import ErrorAlert from "./ErrorAlert";
import FileChip from "./FileChip";
import ThumbnailList from "./ThumbnailList";
import DownloadIcon from "@mui/icons-material/Download";

export interface IUploadImageProps {}

export interface IUploadImageState {
  selectedFile?: File | null;
  error?: string;
  loading?: boolean;
  thumbnails?: Thumbnail[] | null;
}

interface GetPresignedUrlResponseModel {
  presignedUrl: string;
  key: string;
}

interface GenerateThumbnailsResponseModel {
  getObjectSignedUrl400x300: string;
  getObjectSignedUrl160x120: string;
  getObjectSignedUrl120x120: string;
}

const fileTypes = ["image/png", "image/jpeg"];

export default class UploadImage extends React.Component<
  IUploadImageProps,
  IUploadImageState
> {
  constructor(props: IUploadImageProps) {
    super(props);

    this.state = {
      selectedFile: null,
      error: "",
      loading: false,
    };

    this.onSelectFile = this.onSelectFile.bind(this);
    this.getThumbnails = this.getThumbnails.bind(this);
    this.clearSelectedFile = this.clearSelectedFile.bind(this);
    this.clearError = this.clearError.bind(this);
    this.clearThumbnails = this.clearThumbnails.bind(this);
    this.downloadThumbnails = this.downloadThumbnails.bind(this);
  }

  public validateFile(file: File): string {
    if (file.size > 5000000) {
      return `File size (${parseFloat((file.size / 1000000).toString()).toFixed(
        2
      )}MB) exceeds 5MB`;
    }

    if (!fileTypes.includes(file.type)) {
      return `File type (${
        file.type || file.name.split(".")[1]
      }) is not PNG or JPEG`;
    }

    return "";
  }

  public onSelectFile(event: any): void {
    const file: File = event.target.files[0];

    if (file) {
      const error = this.validateFile(file);

      if (error) {
        this.setState(() => ({ error: error }));
        return;
      }

      this.setState(() => {
        const newState: IUploadImageState = {
          selectedFile: event.target.files[0],
          error: "",
        };
        return newState;
      });
    }
  }

  public onInputFileClick(
    event: React.MouseEvent<HTMLInputElement, MouseEvent>
  ): void {
    const element = event.target as HTMLInputElement;
    element.value = "";
  }

  public async getThumbnails(): Promise<void> {
    this.setState(() => ({ loading: true, error: "" }));

    const apiUrl = process.env.REACT_APP_PUBLIC_API;
    const file = this.state.selectedFile;
    if (apiUrl && file) {
      try {
        const getPresignedUrlRequest = `${apiUrl}presignedUrl?fileName=${file.name}&fileType=${file.type}&fileSize=${file.size}`;
        const presignedUrlResponse =
          await axios.get<GetPresignedUrlResponseModel>(
            getPresignedUrlRequest,
            {
              headers: { "Content-Type": "application/json" },
            }
          );

        if (!presignedUrlResponse.data) {
          this.setError("Unable to get thumbnails, try again");
          console.error("Error getting S3 presigned URL");
          return;
        }

        const uploadObjectResponse = await axios.put(
          presignedUrlResponse.data.presignedUrl,
          file,
          {
            headers: {
              "Content-Type": file.type,
            },
          }
        );

        if (uploadObjectResponse.status !== 200) {
          this.setError("Unable to get thumbnails, try again");
          console.error("Error uploading original file to S3");
          return;
        }

        const generateThumbnailsResponse =
          await axios.get<GenerateThumbnailsResponseModel>(
            `${apiUrl}generate?fileS3Key=${presignedUrlResponse.data.key}&fileName=${file.name}`
          );

        if (
          !generateThumbnailsResponse.data.getObjectSignedUrl400x300 ||
          !generateThumbnailsResponse.data.getObjectSignedUrl160x120 ||
          !generateThumbnailsResponse.data.getObjectSignedUrl120x120
        ) {
          this.setError("Unable to get thumbnails, try again");
          console.error("Empty getObject presignedUrls");
          return;
        }

        let thumbnails: Thumbnail[] = [
          {
            src: generateThumbnailsResponse.data.getObjectSignedUrl120x120,
            title: `120x120_${file.name}`,
            width: 120,
            height: 120,
          },
          {
            src: generateThumbnailsResponse.data.getObjectSignedUrl160x120,
            title: `160x120_${file.name}`,
            width: 160,
            height: 120,
          },
          {
            src: generateThumbnailsResponse.data.getObjectSignedUrl400x300,
            title: `400x300_${file.name}`,
            width: 400,
            height: 300,
          },
        ];
        this.setState(() => ({
          loading: false,
          selectedFile: null,
          thumbnails: thumbnails,
        }));
      } catch (error) {
        this.setState(() => ({
          error: "Unable to get thumbnails, try again",
          loading: false,
        }));
        console.error("Error", error);
        return;
      }
    }
  }

  public setError(errorMessage: string): void {
    this.setState(() => ({
      error: errorMessage,
      loading: false,
    }));
  }

  public clearSelectedFile(): void {
    this.setState(() => ({ selectedFile: null }));
  }

  public clearError(): void {
    this.setState(() => ({ error: "" }));
  }

  public clearThumbnails(): void {
    this.setState(() => ({ thumbnails: null }));
  }

  public downloadThumbnails(): void {
    if (this.state.thumbnails) {
      this.state.thumbnails.forEach((thumbnail) => {
        setTimeout(() => {
          window.open(thumbnail.src);
        }, 200);
      });
    }
  }

  public render() {
    return (
      <>
        <div className="flex sm:flex-row flex-col sm:items-center sm:justify-center sm:pt-36 pt-10 sm:ml-0 ml-8">
          {/* Instructions */}
          <div className="flex flex-col text-white">
            <Typography className="max-w-2xl" fontWeight={800} variant="h2">
              Upload an image to get your thumbnails
            </Typography>

            <Typography my={2} variant="body1">
              Upload an Image with the following conditions:
            </Typography>

            <Grid>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <ImageIcon className="text-white" />
                  </ListItemIcon>
                  <ListItemText primary="Must be in PNG, JPEG format" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PhotoSizeSelectLargeIcon className="text-white" />
                  </ListItemIcon>
                  <ListItemText primary="Cannot excede 5MB of size" />
                </ListItem>
              </List>
            </Grid>

            <Typography my={2} variant="body1">
              You will get three images with the following dimensions:
            </Typography>

            <Grid>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <AspectRatioIcon className="text-white" />
                  </ListItemIcon>
                  <ListItemText primary="400x300" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AspectRatioIcon className="text-white" />
                  </ListItemIcon>
                  <ListItemText primary="160x120" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AspectRatioIcon className="text-white" />
                  </ListItemIcon>
                  <ListItemText primary="120x120" />
                </ListItem>
              </List>
            </Grid>
          </div>

          {/* Actions and Thumbnails */}
          <div className="flex flex-col sm:ml-4 ml-0">
            {/* Thumbnails */}
            {this.state.thumbnails && (
              <ThumbnailList thumbnails={this.state.thumbnails} />
            )}

            {/* Actions */}
            <div className="my-2 flex sm:flex-row flex-col">
              {this.state.selectedFile ? (
                <div className="max-w-10">
                  <Button
                    variant="contained"
                    component="span"
                    endIcon={<CloudDownloadOutlinedIcon />}
                    onClick={this.getThumbnails}
                    disabled={this.state.loading}
                  >
                    {this.state.loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Get Thumbnails"
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  <input
                    className="hidden"
                    accept="image/png, image/jpeg"
                    id="select-file-button"
                    type="file"
                    onChange={this.onSelectFile}
                    onClick={this.onInputFileClick}
                  />
                  <label htmlFor="select-file-button">
                    <Button
                      variant="contained"
                      component="span"
                      endIcon={<AddPhotoAlternateOutlinedIcon />}
                    >
                      Select Image
                    </Button>
                  </label>
                </>
              )}

              {this.state.thumbnails && (
                <>
                  <div className="mx-0 sm:mx-2 my-2 sm:my-0">
                    <Button
                      variant="contained"
                      component="span"
                      endIcon={<ClearIcon />}
                      onClick={this.clearThumbnails}
                      color="error"
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="max-w-10">
                    <Button
                      variant="contained"
                      component="span"
                      endIcon={<DownloadIcon />}
                      onClick={this.downloadThumbnails}
                    >
                      Download all
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* File Chip */}
            {this.state.selectedFile && (
              <FileChip
                disabled={!!this.state.loading}
                file={this.state.selectedFile}
                onClearFile={this.clearSelectedFile}
              />
            )}

            {/* Error Alert */}
            {this.state.error && (
              <ErrorAlert
                errorMessage={this.state.error}
                onClearError={this.clearError}
              />
            )}
          </div>
        </div>
      </>
    );
  }
}
