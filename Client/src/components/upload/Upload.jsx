import { IKContext, IKUpload } from "imagekitio-react";
import { useRef } from "react";

const urlEndpoint = import.meta.env.VITE_IMAGE_KIT_ENDPOINT;
const publicKey = import.meta.env.VITE_IMAGE_KIT_PUBLIC_KEY;

// Authentication function to get signature, expire, and token
const authenticator = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/upload");

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Request failed with status ${response.status}: ${errorText}`
      );
    }

    const { signature, expire, token } = await response.json();
    return { signature, expire, token };
  } catch (error) {
    throw new Error(`Authentication request failed: ${error.message}`);
  }
};

// Upload component
const Upload = ({ setImg }) => {
  const ikUploadRef = useRef(null);

  // Error handler for the upload process
  const onError = (error) => {
    console.error("Upload Error:", error);
  };

  // Success handler after a successful upload
  const onSuccess = ({ url, filePath, fileName }) => {
    console.log("Upload Successful:", { url, filePath, fileName });
    setImg((prev) => ({
      ...prev,
      isLoading: false,
      dbData: { url, filePath, fileName },
    }));
  };

  // Upload progress handler
  const onUploadProgress = (progress) => {
    console.log("Upload Progress:", progress);
  };

  // Start handler when file upload begins
  const onUploadStart = (evt) => {
    const file = evt.target.files[0];

    const reader = new FileReader();
    reader.onloadend = () => {
      setImg((prev) => ({
        ...prev,
        isLoading: true,
        aiData: {
          inlineData: {
            data: reader.result.split(",")[1],
            mimeType: file.type,
          },
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input click when label is clicked
  const handleLabelClick = () => {
    ikUploadRef.current.click();
  };

  return (
    <IKContext
      urlEndpoint={urlEndpoint}
      publicKey={publicKey}
      authenticator={authenticator}
    >
      <IKUpload
        fileName="test-upload.png"
        onError={onError}
        onSuccess={onSuccess}
        onUploadProgress={onUploadProgress}
        onUploadStart={onUploadStart}
        useUniqueFileName={true}
        style={{ display: "none" }}
        ref={ikUploadRef}
      />
      <label onClick={handleLabelClick}>
        <img src="/attachment.png" alt="Upload attachment" />
      </label>
    </IKContext>
  );
};

export default Upload;
