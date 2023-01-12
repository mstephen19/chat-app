import { memo, useEffect, useState } from 'react';
import { Box } from 'grommet';
import type { RoomEvent, RoomMap } from '../../types';
import RoomPreview from './RoomPreview';

type RoomWatcherProps = {
    onSubmit(): void;
};

const RoomWatcher = ({ onSubmit }: RoomWatcherProps) => {
    const [rooms, setRooms] = useState<RoomMap>({});

    useEffect(() => {
        const stream = new EventSource('http://localhost:3001/rooms', {
            withCredentials: true,
        });

        const messageHandler = ({ data }: MessageEvent<string>) => {
            const roomEvent = JSON.parse(data) as RoomEvent;

            setRooms((prev) => {
                if (roomEvent.user_count <= 0 && !(roomEvent.room_id in prev)) return prev;

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
        <Box
            justify='center'
            style={{ columnGap: '10px', rowGap: '10px', marginTop: '10px' }}
            flex
            wrap
            direction='row'
            width={{ max: '350px' }}>
            {Object.entries(rooms).map(([id, count]) => {
                return <RoomPreview key={`${id}-status`} roomId={id} userCount={count} onSubmit={onSubmit} />;
            })}
        </Box>
    );
};

export default memo(RoomWatcher);
