import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Grommet } from 'grommet';
import { Toaster } from 'react-hot-toast';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <Provider store={store}>
            <Grommet>
                <Toaster
                    position='top-center'
                    toastOptions={{ duration: 3e3 }}
                    containerStyle={{
                        pointerEvents: 'none',
                        userSelect: 'none',
                    }}
                />
                <App />
            </Grommet>
        </Provider>
    </React.StrictMode>
);
