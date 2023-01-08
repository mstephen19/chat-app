import { Box, Text } from 'grommet';

import type { ReceivedMessage } from '../../types';

type MessageProps = {
    me?: boolean;
    messageData: ReceivedMessage;
};

export const Message = ({ me, messageData }: MessageProps) => {
    return (
        <Box flex={{ shrink: 0 }} alignSelf={!me ? 'start' : 'end'} direction='row' background='green' height='fit-content'>
            <Text>
                {messageData.sender}: {messageData.message}
            </Text>
        </Box>
    );
};
