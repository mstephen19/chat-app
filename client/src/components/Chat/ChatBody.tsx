import { useRef, useEffect, lazy, Suspense } from 'react';
import { Spinner, CardBody, Box } from 'grommet';
import { MessageType } from '../../constants';

const Message = lazy(() => import('./Message'));
const UserEvent = lazy(() => import('./UserEvent'));

import type { ReceivedMessage, UserInfo } from '../../types';

type ChatBodyProps = {
    messages: ReceivedMessage[];
    connecting: boolean;
    userInfo: UserInfo;
};

export const ChatBody = ({ messages, connecting, userInfo }: ChatBodyProps) => {
    const chatBoxRef = useRef<HTMLDivElement>(null);

    // Scrolls the chat down when a message is received. Works because useEffect is run after the
    // DOM is painted based on results from
    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scroll({ top: chatBoxRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    return (
        <Suspense fallback={null}>
            <CardBody flex width='100%' height='80%' justify='center' align='center'>
                {connecting ? (
                    <Spinner size='large' />
                ) : (
                    <Box
                        ref={chatBoxRef}
                        height='100%'
                        width='100%'
                        overflow={{ horizontal: 'hidden', vertical: 'scroll' }}
                        pad='medium'
                        gap='small'>
                        {messages.map((msg) => {
                            switch (msg.message_type) {
                                default:
                                    return;
                                case MessageType.Message:
                                    return (
                                        <Message
                                            messageData={msg}
                                            me={msg.sender_id === userInfo.id}
                                            key={`${msg.sender_id}-${msg.time}`}
                                        />
                                    );
                                case MessageType.UserLeave:
                                case MessageType.UserJoin:
                                    return <UserEvent key={`${msg.sender_id}-join-${msg.time}`} messageData={msg} />;
                            }
                        })}
                    </Box>
                )}
            </CardBody>
        </Suspense>
    );
};
