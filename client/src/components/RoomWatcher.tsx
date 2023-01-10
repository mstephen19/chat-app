import { memo, useEffect, useState } from 'react';
import type { RoomEvent, RoomMap } from '../types';

const RoomWatcher = () => {
    const [rooms, setRooms] = useState<RoomMap>({});

    useEffect(() => {
        const stream = new EventSource('http://localhost:3001/rooms', {
            withCredentials: true,
        });

        const messageHandler = ({ data }: MessageEvent<string>) => {
            const roomEvent = JSON.parse(data) as RoomEvent;

            console.log(roomEvent);

            setRooms((prev) => {
                // If the current amount of users in the room is zero, and
                if (roomEvent.user_count <= 0 && roomEvent.room_id in prev) {
                    const { [roomEvent.room_id]: _, ...rest } = prev;
                    return rest;
                }

                return {
                    ...prev,
                    [roomEvent.room_id]: roomEvent.user_count,
                };
            });
        };
        stream.addEventListener('message', messageHandler);

        return () => {
            // Clean up the listener
            stream.removeEventListener('message', messageHandler);
            stream.close();
        };
    }, []);

    return (
        <ul>
            {Object.entries(rooms).map(([id, count]) => {
                return (
                    <li key={`${id}-status`}>
                        {id}, {count}
                    </li>
                );
            })}
        </ul>
    );
};

export default memo(RoomWatcher);
