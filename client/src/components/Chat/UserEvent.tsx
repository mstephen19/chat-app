import { Text } from 'grommet';
import type { ReceivedMessage } from '../../types';
import { MessageType } from '../../constants';

type UserEventProps = {
    messageData: ReceivedMessage;
};

export const UserEvent = ({ messageData: { sender } }: UserEventProps) => {
    return (
        <Text alignSelf='center' size='small'>
            {`${sender} joined the chat!`}
        </Text>
    );
};
