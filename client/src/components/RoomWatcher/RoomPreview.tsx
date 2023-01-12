import { memo } from 'react';
import { Box, CardHeader, CardBody, Text, Button } from 'grommet';
import { useDispatch, useSelector } from 'react-redux';
import { User } from 'grommet-icons';
import { set } from '../../redux/userInfo';
import { nanoid } from 'nanoid';

import type { UserInfo } from '../../types';

type RoomPreviewProps = {
    roomId: string;
    userCount: number;
    onSubmit(): void;
};

const RoomPreview = ({ roomId, userCount, onSubmit }: RoomPreviewProps) => {
    const dispatch = useDispatch();
    const userInfo = useSelector<{ userInfo: UserInfo }, UserInfo>((state) => state.userInfo);

    const formattedCount = Intl.NumberFormat(undefined, { notation: 'compact' }).format(userCount);

    return (
        <Box height='fit-content' round='small' overflow='hidden' background='grey' elevation='medium' width={{ width: 'xsmall' }}>
            <CardHeader background='white' pad='xxsmall' gap='xsmall'>
                <Box
                    style={{
                        display: 'inline-block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                    width='75%'>
                    <Text size='small'>{roomId}</Text>
                </Box>
                <Box direction='row' flex justify='center' align='center' width='fit-content'>
                    <User color='#242424' size='small' />
                    <Text size='small'>{formattedCount}</Text>
                </Box>
            </CardHeader>
            <CardBody flex justify='center' align='center' pad='xxsmall'>
                <Box width='50%'>
                    <Button
                        primary
                        style={{ textAlign: 'center' }}
                        hoverIndicator={{ elevation: 'xlarge', background: '#242424' }}
                        onClick={async () => {
                            await new Promise((resolve) => {
                                let id = userInfo.id;

                                if (!id) {
                                    id = nanoid();
                                    dispatch(set({ id }));
                                }

                                if (!userInfo.name) dispatch(set({ name: `user-${id.slice(0, 5)}` }));
                                dispatch(set({ room: roomId }));
                                resolve(true);
                            });
                            onSubmit();
                        }}>
                        Join
                    </Button>
                </Box>
            </CardBody>
        </Box>
    );
};

export default memo(RoomPreview);
