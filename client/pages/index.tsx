import Head from 'next/head';
import { useState } from 'react';
import styles from '../styles/Home.module.css';
import Link from 'next/link';

export default function Home() {
    const [roomId, setRoomId] = useState('');

    return (
        <>
            <Head>
                <title>SSE Chat</title>
                <meta name='description' content='Choose a chat room' />
                <meta name='viewport' content='width=device-width, initial-scale=1' />
                <link rel='icon' href='/favicon.ico' />
            </Head>

            <main className={styles.main}>
                <form
                    autoComplete='off'
                    onSubmit={(e) => {
                        e.preventDefault();
                    }}>
                    <label htmlFor='room-name'>Enter a room name</label>
                    <input id='room-name' value={roomId} onChange={(e) => setRoomId(e.target.value.trim())} />

                    {roomId !== '' ? (
                        <Link href={`/${roomId}`}>
                            <button type='submit'>Join</button>
                        </Link>
                    ) : (
                        <button type='submit'>Join</button>
                    )}
                </form>
            </main>
        </>
    );
}
