import { useEffect } from 'react';
import type { RoomEvent } from '../types';

export const RoomWatcher = () => {
    useEffect(() => {
        const stream = new EventSource('http://localhost:3001/rooms', {
            withCredentials: true,
        });

        stream.addEventListener('message', ({ data }) => {
            const roomEvent = JSON.parse(data) as RoomEvent;
        });

        return () => {
            stream.close();
        };
    }, []);

    return <div>RoomWatcher</div>;
};
