import { CardHeader, Box, Button, Text, Clock } from 'grommet';
import { LinkPrevious } from 'grommet-icons';

type ChatHeaderProps = {
    room: string;
    onExit(): void;
};

export const ChatHeader = ({ room, onExit }: ChatHeaderProps) => {
    return (
        <CardHeader flex justify='center' align='center' height={{ max: '50px' }}>
            <Box direction='row' width='20%'>
                <Button color='white' icon={<LinkPrevious color='white' rotate='180deg' />} size='small' onClick={onExit} />
            </Box>
            <Box direction='row' justify='center' align='center' width='80%' gap='20px'>
                <Text weight='bold'>Room:</Text>
                <Text>{room}</Text>
            </Box>
            <Box direction='row' width='20%' justify='center' align='center'>
                <Clock size='xsmall' precision='minutes' type='digital' hourLimit={12} />
            </Box>
        </CardHeader>
    );
};
