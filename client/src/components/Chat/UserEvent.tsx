import { Text } from 'grommet';
import type { ReceivedMessage } from '../../types';
import { MessageType } from '../../constants';

type UserEventProps = {
    messageData: ReceivedMessage;
};

export const UserEvent = ({ messageData: { message_type, sender } }: UserEventProps) => {
    return (
        <Text alignSelf='center' size='small'>
            {`${sender} ${message_type === MessageType.UserJoin ? 'joined' : 'left'} the chat!`}
        </Text>
    );
};
