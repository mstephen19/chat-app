import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

type Message = {
    message: string;
    time: number;
};

export default function Room() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [connecting, setConnecting] = useState(true);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        if (!router.query.id) return void router.push('/');

        const stream = new EventSource(`http://localhost:3001/rooms/${router.query.id}`);

        const messageHandler = (e: MessageEvent<string>) => {
            const message = JSON.parse(e.data) as Message;
            console.log(message);

            setMessages((prev) => [message, ...prev]);
        };
        stream.addEventListener('message', messageHandler);

        const openHandler = () => {
            setConnecting(false);
            stream.removeEventListener('open', openHandler);
        };
        stream.addEventListener('open', openHandler);

        const errorHandler = () => router.push('/');
        stream.addEventListener('error', errorHandler);

        return () => {
            stream.removeEventListener('message', messageHandler);
            stream.removeEventListener('error', errorHandler);
        };
    }, []);

    return (
        <>
            {connecting ? (
                <p>Connecting...</p>
            ) : (
                <>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();

                            (async () => {
                                await fetch(`http://localhost:3001/messages/${router.query.id}`, {
                                    method: 'POST',
                                    body: JSON.stringify({
                                        message: newMessage,
                                    }),
                                });

                                setNewMessage('');
                            })();
                        }}>
                        <input
                            name='message'
                            type='text'
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                            }}
                        />
                        <button type='submit'>Send</button>
                    </form>
                    <ul>
                        {messages.map(({ time, message }) => {
                            return <li key={time}>{message}</li>;
                        })}
                    </ul>
                </>
            )}
        </>
    );
}
