import { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card } from 'grommet';
import { toast } from 'react-hot-toast';
import { ChatFooter } from './ChatFooter';
import { ChatHeader } from './ChatHeader';
import { ChatBody } from './ChatBody';

import type { KeyboardEventHandler } from 'react';
import type { MessageToSend, ReceivedMessage, UserInfo } from '../../types';

type ChatProps = {
    onExit(): void;
};

export const Chat = ({ onExit }: ChatProps) => {
    const userInfo = useSelector<{ userInfo: UserInfo }, UserInfo>((state) => state.userInfo);
    const [connecting, setConnecting] = useState(true);
    const [messages, setMessages] = useState<ReceivedMessage[]>([]);

    useEffect(() => {
        // If any of the values are for some reason falsy (empty string or
        // null/undefined somehow), immediately exit the chat.
        if (Object.values(userInfo).some((val) => !val)) return onExit();

        const stream = new EventSource(`http://localhost:3001/rooms/${userInfo.room}?user_id=${userInfo.id}&user_name=${userInfo.name}`, {
            withCredentials: true,
        });

        const handleOpen = () => {
            setConnecting(false);
            stream.removeEventListener('open', handleOpen);
        };
        stream.addEventListener('open', handleOpen);

        const handleMessage = (e: MessageEvent<string>) => {
            const data = JSON.parse(e.data) as ReceivedMessage;

            setMessages((prev) => {
                // Prevent the more than 100 messages from being rendered at a time.
                if (prev.length === 100) prev.shift();
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

            const { minLength, value } = e.currentTarget as HTMLTextAreaElement;
            const trimmedValue = value.trim();
            if (trimmedValue.length < +minLength) return;

            (async () => {
                try {
                    const promise = fetch(`http://localhost:3001/messages/${userInfo.room}`, {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        method: 'POST',
                        credentials: 'include',
                        body: JSON.stringify({
                            sender_id: userInfo.id,
                            sender: userInfo.name,
                            message: trimmedValue,
                        } satisfies MessageToSend),
                    });

                    e.currentTarget.value = '';

                    await promise;
                } catch (error) {
                    toast.error('Failed to send message!');
                }
            })();
        },
        [userInfo]
    );

    return (
        <Card
            elevation='xlarge'
            background='grey'
            width='clamp(200px, 90vw, 500px)'
            height={{ height: 'medium', min: 'small', max: 'medium' }}>
            <ChatHeader room={userInfo.room} onExit={onExit} />
            <ChatBody messages={messages} userInfo={userInfo} connecting={connecting} />
            <ChatFooter onKeyDown={handleSend} />
        </Card>
    );
};
