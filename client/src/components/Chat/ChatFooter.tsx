import { CardFooter, TextArea } from 'grommet';
import { KeyboardEventHandler } from 'react';

type ChatFooterProps = {
    onKeyDown: KeyboardEventHandler<HTMLTextAreaElement>;
};

export const ChatFooter = ({ onKeyDown }: ChatFooterProps) => {
    return (
        <CardFooter height={{ min: '75px' }} pad='medium'>
            <TextArea
                autoFocus
                onKeyDown={onKeyDown}
                color='white'
                size='small'
                id='input-message'
                name='message'
                placeholder={'type something...'}
                resize={false}
                minLength={1}
                maxLength={100}
            />
        </CardFooter>
    );
};
