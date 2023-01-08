import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Grommet } from 'grommet';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <Provider store={store}>
            <Grommet>
                <App />
            </Grommet>
        </Provider>
    </React.StrictMode>
);
