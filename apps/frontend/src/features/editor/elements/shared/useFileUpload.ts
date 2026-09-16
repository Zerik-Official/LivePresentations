import { useState } from "react";

import { uploadFile } from "../../../../lib/api";

/**
 * Reusable file upload logic for image and video elements.
 * @returns Upload state and handler
 */
export function useFileUpload(): {
  uploading: boolean;
  error: string | null;
  upload: (file: File) => Promise<string | null>;
} {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Upload a file and return its URL.
   * @param file - File to upload
   * @returns URL or null on error
   */
  async function upload(file: File): Promise<string | null> {
    if (file.size > 100 * 1024 * 1024) {
      setError("Archivo excede 100MB");
      return null;
    }
    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadFile(file);
      return url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { uploading, error, upload };
}
