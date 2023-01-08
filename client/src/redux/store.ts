import { configureStore } from '@reduxjs/toolkit';
import { reducer as userInfoReducer } from './userInfo';

export const store = configureStore({
    reducer: {
        userInfo: userInfoReducer,
    },
});
