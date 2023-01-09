import { useCallback } from 'react';
import { Form, Box, FormField, TextInput, Button } from 'grommet';
import { User, Login, Edit } from 'grommet-icons';
import { useSelector, useDispatch } from 'react-redux';
import { nanoid } from 'nanoid';
import { set } from '../redux/userInfo';

import type { FormExtendedEvent } from 'grommet';
import type { KeyboardEventHandler } from 'react';
import type { UserInfo } from '../types';
import { FIELD_REGEX } from '../constants';

type JoinFormValues = Omit<UserInfo, 'id'>;

type JoinBoxProps = {
    onSubmit(): void;
};

export const JoinBox = ({ onSubmit }: JoinBoxProps) => {
    const userInfo = useSelector<{ userInfo: UserInfo }, UserInfo>((state) => state.userInfo);
    const dispatch = useDispatch();

    // Prevent spaces from being added in an input element
    const preventSpaces: KeyboardEventHandler<HTMLInputElement> = useCallback((e) => {
        if (e.code === 'Space') e.preventDefault();
    }, []);

    // Set the values when they're changed within the form
    const handleChange: (values: JoinFormValues) => void = useCallback(({ name, room }) => {
        dispatch(set({ name: name.replace(FIELD_REGEX, '') ?? '', room: room?.replace(FIELD_REGEX, '') ?? '' }));
    }, []);

    const handleSubmit = useCallback((e: FormExtendedEvent<JoinFormValues>) => {
        e.preventDefault();
        // Once submitting, if no userID has been set yet, go ahead and set one.
        // It's required for interacting with the backend.
        if (!userInfo.id) dispatch(set({ id: nanoid() }));
        onSubmit();
    }, []);

    return (
        <Box elevation='medium' background='grey' round='small' pad='medium'>
            <Form value={userInfo} onChange={handleChange} onSubmit={handleSubmit}>
                <FormField name='name' htmlFor='input-name' label='Nickname'>
                    <TextInput id='input-name' name='name' placeholder='John42' icon={<User />} onKeyDown={preventSpaces} maxLength={15} />
                </FormField>
                <FormField name='room' htmlFor='input-room' label='Room name'>
                    <TextInput
                        id='input-room'
                        name='room'
                        placeholder='lilys-cool-room'
                        icon={<Edit />}
                        onKeyDown={preventSpaces}
                        maxLength={25}
                    />
                </FormField>
                <Box flex justify='center' pad='small'>
                    <Button type='submit' label='Join' icon={<Login />} disabled={!userInfo.name || !userInfo.room} />
                </Box>
            </Form>
        </Box>
    );
};
