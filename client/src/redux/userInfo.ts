import { createSlice } from '@reduxjs/toolkit';
import type { UserInfo } from '../types';

const userInfoSlice = createSlice({
    name: 'userInfo',
    initialState: { id: '', name: '', room: '' } as UserInfo,
    reducers: {
        set(state, { payload }) {
            return {
                ...state,
                ...payload,
            };
        },
    },
});

export const reducer = userInfoSlice.reducer;
export const { set } = userInfoSlice.actions;
