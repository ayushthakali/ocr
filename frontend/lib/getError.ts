
import axios from "axios";

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error || "Something went wrong.";
  }
  if (err instanceof Error) return err.message;
  return "Unexpected error occurred.";
}
