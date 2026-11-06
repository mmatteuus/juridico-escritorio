import { useEffect, useRef } from "react";
import { useOnline } from "@/hooks/useOnline"; // corrected import

/**
 * Queue that stores mutation functions while the app is offline.
 * When the network comes back it replays them in order.
 */
export function useOfflineQueue() {
  const queue = useRef<Array<() => Promise<unknown>>>([]);
  const { isOnline } = useOnline();

  useEffect(() => {
    if (isOnline && queue.current.length) {
      // Replay all queued mutations sequentially.
      (async () => {
        for (const fn of queue.current) {
          try {
            await fn();
          } catch (e) {
            console.error("Offline mutation failed", e);
          }
        }
        queue.current = [];
      })();
    }
  }, [isOnline]);

  // Return a function that callers can wrap their mutation in.
  const enqueue = (mutation: () => Promise<any>) => {
    if (isOnline) {
      mutation();
    } else {
      queue.current.push(mutation);
    }
  };

  return { enqueue };
}
