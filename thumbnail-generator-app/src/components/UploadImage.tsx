import {
  Button,
  CircularProgress,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import PhotoSizeSelectLargeIcon from "@mui/icons-material/PhotoSizeSelectLarge";
import AspectRatioIcon from "@mui/icons-material/AspectRatio";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import CloudDownloadOutlinedIcon from "@mui/icons-material/CloudDownloadOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import React from "react";
import axios from "axios";

export interface IUploadImageProps {}

export interface IUploadImageState {
  selectedFile?: File | null;
  error?: string;
  loading?: boolean;
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
  }

  public validateFile(file: File): string {
    if (file.size > 5000000) {
      return `File size (${parseFloat((file.size / 1000000).toString()).toFixed(
        2
      )}MB) exceeds 5MB`;
    }

    if (!fileTypes.includes(file.type)) {
      return `File type (${file.type}) is not PNG or JPEG`;
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

        window.open(generateThumbnailsResponse.data.getObjectSignedUrl400x300);

        window.open(generateThumbnailsResponse.data.getObjectSignedUrl160x120);

        window.open(generateThumbnailsResponse.data.getObjectSignedUrl120x120);

        this.setState(() => ({ loading: false, selectedFile: null }));
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

  public render() {
    return (
      <div className="m-4">
        <Typography className="text-slate-900" variant="h4">
          Upload an image to get your thumbnails
        </Typography>

        <Typography my={2} variant="body1">
          Upload an Image with the following conditions:
        </Typography>

        <Grid>
          <List>
            <ListItem>
              <ListItemIcon>
                <ImageIcon />
              </ListItemIcon>
              <ListItemText primary="Must be in PNG, JPEG format" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <PhotoSizeSelectLargeIcon />
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
                <AspectRatioIcon />
              </ListItemIcon>
              <ListItemText primary="400x300" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <AspectRatioIcon />
              </ListItemIcon>
              <ListItemText primary="160x120" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <AspectRatioIcon />
              </ListItemIcon>
              <ListItemText primary="120x120" />
            </ListItem>
          </List>
        </Grid>

        <div className="my-2">
          {this.state.selectedFile ? (
            <>
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
            </>
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
        </div>

        {this.state.selectedFile && (
          <div className="my-4 inline-block rounded shadow-md bg-teal-800 hover:bg-teal-900 font-semibold text-xl text-white">
            <Stack direction="row" spacing={1}>
              <Typography p={2}>{this.state.selectedFile.name}</Typography>
              <IconButton
                color="inherit"
                aria-label="clear"
                onClick={this.clearSelectedFile}
                disabled={this.state.loading}
              >
                <CloseOutlinedIcon />
              </IconButton>
            </Stack>
          </div>
        )}

        {this.state.error && (
          <div className="my-4 inline-block rounded shadow-md bg-red-500 hover:bg-red-600 font-semibold text-xl text-white">
            <Stack direction="row" spacing={1}>
              <Typography p={2}>{this.state.error}</Typography>
              <IconButton
                color="inherit"
                aria-label="clear"
                onClick={this.clearError}
              >
                <CloseOutlinedIcon />
              </IconButton>
            </Stack>
          </div>
        )}
      </div>
    );
  }
}
