import type { MessageType } from '../constants';

export type MessageToSend = {
    /**
     * A unique client-generated ID.
     */
    sender_id: string;
    /**
     * The name of the sender.
     */
    sender: string;
    /**
     * The message contents.
     */
    message: string;
};

export type ReceivedMessage = MessageToSend & {
    /**
     * A unix timestamp in milliseconds for when
     * the message was sent.
     */
    time: number;
    message_type: MessageType;
};

export type UserInfo = {
    id: string;
    name: string;
    room: string;
};
