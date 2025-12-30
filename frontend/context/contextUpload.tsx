"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";

interface QueueItem {
  id: number;
  fileName: string;
  status: "processing" | "success" | "error";
  timestamp: string;
  data?: {
    document_key?: string;
    category?: string;
    error?: string;
  };
}

interface UploadContextType {
  processingQueue: QueueItem[];
  errorMessage: string | null;
  queueIdCounter: number;
  MAX_FILES: number;
  addToQueue: (file: File) => number;
  updateQueueItem: (
    queueId: number,
    status: "processing" | "success" | "error",
    data?: any
  ) => void;
  removeFromQueue: (queueId: number) => void;
  uploadFile: (
    file: File,
    companyId: string,
    companyName: string
  ) => Promise<void>;
  processFiles: (files: File[], companyId: string , companyName: string) => void;
  setErrorMessage: (message: string | null) => void;
  isUploadDisabled: boolean;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const MAX_FILES = 3;

export function UploadProvider({ children }: { children: ReactNode }) {
  const [processingQueue, setProcessingQueue] = useState<QueueItem[]>([]);
  const [queueIdCounter, setQueueIdCounter] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addToQueue = useCallback((file: File): number => {
    let queueId: number;
    setQueueIdCounter((prev) => {
      queueId = prev + 1;
      return queueId;
    });
    const queueItem: QueueItem = {
      id: queueId!,
      fileName: file.name,
      status: "processing",
      timestamp: new Date().toLocaleTimeString(),
    };
    setProcessingQueue((prev) => [...prev, queueItem]);
    return queueId!;
  }, []);

  const updateQueueItem = useCallback(
    (
      queueId: number,
      status: "processing" | "success" | "error",
      data?: any
    ) => {
      setProcessingQueue((prev) =>
        prev.map((item) =>
          item.id === queueId ? { ...item, status, data } : item
        )
      );
    },
    []
  );

  const removeFromQueue = useCallback((queueId: number) => {
    setTimeout(() => {
      setProcessingQueue((prev) => prev.filter((item) => item.id !== queueId));
    }, 1500);
  }, []);

  const uploadFile = useCallback(
    async (file: File, companyId: string, companyName: string) => {
      const queueId = addToQueue(file);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await axios.post("/api/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-Active-Company": companyId,
            "X-Company-Name": companyName,
          },
        });
        updateQueueItem(queueId, "success", res.data);
        removeFromQueue(queueId);
      } catch (err) {
        console.error("API Error: ", err);
        updateQueueItem(queueId, "error", {
          error: "Upload failed",
        });
        removeFromQueue(queueId);
      }
    },
    [addToQueue, updateQueueItem, removeFromQueue]
  );

  const processFiles = useCallback(
    (files: File[], companyId: string, companyName: string) => {
      const currentQueueLength = processingQueue.length;
      const availableSlots = MAX_FILES - currentQueueLength;

      if (availableSlots <= 0) {
        setErrorMessage(
          `Maximum ${MAX_FILES} files allowed. Please wait for current uploads to complete.`
        );
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }

      if (files.length > availableSlots) {
        setErrorMessage(
          `You can only upload ${availableSlots} more file(s). Maximum ${MAX_FILES} files at a time.`
        );
        setTimeout(() => setErrorMessage(null), 5000);
        // Only process the files that fit
        files
          .slice(0, availableSlots)
          .forEach((file) => uploadFile(file, companyId, companyName));

        const rejectedFiles = files
          .slice(availableSlots)
          .map((f) => f.name)
          .join(", ");

        toast.error(`Failed to upload: ${rejectedFiles}`, {
          position: "top-right",
          autoClose: 4000,
        });
      } else {
        files.forEach((file) => uploadFile(file, companyId, companyName));
      }
    },
    [processingQueue.length, uploadFile]
  );

  const isUploadDisabled = processingQueue.length >= MAX_FILES;

  return (
    <UploadContext.Provider
      value={{
        processingQueue,
        errorMessage,
        queueIdCounter,
        MAX_FILES,
        addToQueue,
        updateQueueItem,
        removeFromQueue,
        uploadFile,
        processFiles,
        setErrorMessage,
        isUploadDisabled,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
}
