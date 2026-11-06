import { toast } from "sonner";

/**
 * Simple wrapper around Sonner to show toast notifications.
 *
 * @param message The text to display in the toast.
 * @param options Optional Sonner toast options (type, duration, etc.).
 */
export function notify(message: string, options?: Parameters<typeof toast>[1]) {
  toast(message, options);
}
