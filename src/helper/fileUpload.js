import axiosInstance from "@/lib/axios";

export async function uploadFileAndGetUrl(file, uploadUrl) {
  if (!file || !uploadUrl) {
    throw new Error("File or upload URL is missing");
  }
  try {
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await axiosInstance.post(uploadUrl, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    console.log("uploadRes", uploadRes);
    console.log("uploadRes.data", uploadRes.data);

    // Return the file URL from response
    // Check multiple possible response structures
    const fileUrl = uploadRes.data?.file || 
                    uploadRes.data?.url || 
                    uploadRes.data?.data?.file || 
                    uploadRes.data?.data?.url || 
                    "";
    
    if (!fileUrl) {
      console.warn("No file URL found in response:", uploadRes.data);
      throw new Error("File upload succeeded but no file URL was returned");
    }
    
    return fileUrl;
  } catch (err) {
    // Extract error message from response
    let errorMessage = "Failed to upload file";
    
    if (err.response?.data) {
      // Check for validation errors
      if (err.response.data.errors) {
        const errors = err.response.data.errors;
        // Get first error message
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          errorMessage = firstError[0];
        } else if (typeof firstError === 'string') {
          errorMessage = firstError;
        }
      } else if (err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.response.data.error) {
        errorMessage = err.response.data.error;
      }
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Upload file and get all processed image sizes
 * Returns an object with all image sizes (thumbnail, mobile, tablet, desktop, original)
 */
export async function uploadFileWithSizes(file, uploadUrl) {
  if (!file || !uploadUrl) return null;
  try {
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await axiosInstance.post(uploadUrl, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    console.log("uploadRes with sizes", uploadRes);

    // Return the full response with all image sizes
    return {
      url: uploadRes.data?.url || uploadRes.data?.data?.url || "",
      thumbnail: uploadRes.data?.thumbnail || uploadRes.data?.data?.thumbnail || "",
      original: uploadRes.data?.original || uploadRes.data?.data?.original || "",
      images: uploadRes.data?.images || uploadRes.data?.data?.images || [],
    };
  } catch (err) {
    console.error("Error uploading file with sizes:", err);
    return null;
  }
}
