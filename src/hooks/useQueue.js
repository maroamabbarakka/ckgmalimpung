import { useEffect, useState } from 'react';
import { subscribeQueueByStatus } from '../services/queueService';

export default function useQueue(statusKey) {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeQueueByStatus(statusKey, setQueue, () => setQueue([]));

    return () => unsubscribe();
  }, [statusKey]);

  return queue;
}
