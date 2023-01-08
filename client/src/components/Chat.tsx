import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardBody, CardFooter, Text, TextArea } from 'grommet';
import { UserInfo } from '../types';

type ChatProps = {
    onExit(): void;
};

export const Chat = ({}: ChatProps) => {
    const userInfo = useSelector<{ userInfo: UserInfo }, UserInfo>((state) => state.userInfo);
    const [message, setMessage] = useState('');

    return (
        <Card
            elevation='xlarge'
            background='grey'
            width={{ width: 'medium', min: 'small', max: 'xlarge' }}
            height={{ height: 'medium', min: 'small', max: 'medium' }}>
            <CardHeader flex justify='center' align='center' height={{ max: '50px' }}>
                <Text weight='bold'>Current room:</Text>
                <Text>{userInfo.room}</Text>
            </CardHeader>
            <CardBody pad='medium' flex>
                Body
            </CardBody>
            <CardFooter height={{ min: '75px' }} pad='medium'>
                <TextArea
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value);
                    }}
                    color='white'
                    size='small'
                    id='input-message'
                    name='message'
                    placeholder="hey what's up?"
                    resize={false}
                />
            </CardFooter>
        </Card>
    );
};
