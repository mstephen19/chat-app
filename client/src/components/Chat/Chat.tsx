import { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardBody, CardFooter, TextArea, CardHeader, Box, Button, Text, Spinner, Clock } from 'grommet';
import { LinkPrevious } from 'grommet-icons';
import { toast } from 'react-hot-toast';
import { Message } from './Message';

import type { ChangeEventHandler, KeyboardEventHandler } from 'react';
import type { MessageToSend, ReceivedMessage, UserInfo } from '../../types';

type ChatProps = {
    onExit(): void;
};

export const Chat = ({ onExit }: ChatProps) => {
    const userInfo = useSelector<{ userInfo: UserInfo }, UserInfo>((state) => state.userInfo);
    const [message, setMessage] = useState('');
    const [connecting, setConnecting] = useState(true);
    const [messages, setMessages] = useState<ReceivedMessage[]>([]);
    const chatBoxRef = useRef<HTMLDivElement>(null);

    const changeHandler: ChangeEventHandler<HTMLTextAreaElement> = useCallback((e) => {
        setMessage(e.target.value);
    }, []);

    // Scrolls the chat down when a message is received. Works because useEffect is run after the
    // DOM is painted based on results from
    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scroll({ top: chatBoxRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        // If any of the values are for some reason falsy (empty string or
        // null/undefined somehow), immediately exit the chat.
        if (Object.values(userInfo).some((val) => !val)) return onExit();

        const stream = new EventSource(`http://localhost:3001/rooms/${userInfo.room}`);

        const handleOpen = () => {
            setConnecting(false);
            stream.removeEventListener('open', handleOpen);
        };
        stream.addEventListener('open', handleOpen);

        const handleMessage = (e: MessageEvent<string>) => {
            // Later on, there can be different message types such as
            // user_join and user_leave
            if (e.type !== 'message') return;
            const data = JSON.parse(e.data) as ReceivedMessage;
            setMessages((prev) => {
                // ! Later on, limit the max size of the message list to be
                // ! only 50 messages!
                return [...prev, data];
            });
        };
        stream.addEventListener('message', handleMessage);

        // Stop listening on the stream and completely close it when the
        // component is unmounted.
        return () => {
            stream.removeEventListener('message', handleMessage);
            stream.close();
        };
    }, []);

    const handleSend: KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
        (e) => {
            // If enter is pressed, but not in tandem with the shift key
            // Go ahead and sent off the message.
            if (e.code !== 'Enter' || e.shiftKey) return;
            e.preventDefault();

            const { minLength } = e.currentTarget as HTMLTextAreaElement;
            if (message.length < +minLength) return;

            (async () => {
                try {
                    const promise = fetch(`http://localhost:3001/messages/${userInfo.room}`, {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        method: 'POST',
                        body: JSON.stringify({
                            sender_id: userInfo.id,
                            sender: userInfo.name,
                            message,
                        } satisfies MessageToSend),
                    });

                    setMessage('');

                    await promise;
                } catch (error) {
                    toast.error('Failed to send message!');
                }
            })();
        },
        [message, userInfo]
    );

    return (
        <Card
            elevation='xlarge'
            background='grey'
            width={{ width: 'medium', min: 'xsmall', max: 'xlarge' }}
            height={{ height: 'medium', min: 'small', max: 'medium' }}>
            <CardHeader flex justify='center' align='center' height={{ max: '50px' }}>
                <Box direction='row' width='20%'>
                    <Button color='white' icon={<LinkPrevious color='white' rotate='180deg' />} size='small' onClick={onExit} />
                </Box>
                <Box direction='row' justify='center' align='center' width='80%' gap='20px'>
                    <Text weight='bold'>Current room:</Text>
                    <Text>{userInfo.room}</Text>
                </Box>
                <Box direction='row' width='20%'>
                    <Clock size='xsmall' precision='minutes' type='digital' hourLimit={12} />
                </Box>
            </CardHeader>
            <CardBody flex width='100%' height='80%' justify='center' align='center'>
                {connecting ? (
                    <Spinner size='medium' />
                ) : (
                    <Box
                        ref={chatBoxRef}
                        height='100%'
                        width='100%'
                        overflow={{ horizontal: 'hidden', vertical: 'scroll' }}
                        pad='medium'
                        gap='medium'>
                        {messages.map((msg) => {
                            return <Message messageData={msg} me={msg.sender_id === userInfo.id} key={`${msg.sender_id}-${msg.time}`} />;
                        })}
                    </Box>
                )}
            </CardBody>
            <CardFooter height={{ min: '75px' }} pad='medium'>
                <TextArea
                    autoFocus
                    onKeyDown={handleSend}
                    value={message}
                    onChange={changeHandler}
                    color='white'
                    size='small'
                    id='input-message'
                    name='message'
                    placeholder='type something...'
                    resize={false}
                    minLength={1}
                />
            </CardFooter>
        </Card>
    );
};
