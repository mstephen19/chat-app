import { useState } from 'react';
import { Header, Main, Text } from 'grommet';
import { Chat as ChatIcon } from 'grommet-icons';
import { Chat } from './components/Chat';

import { JoinBox } from './components/JoinBox';

function App() {
    const [joined, setJoined] = useState(false);

    return (
        <>
            <Header sticky='scrollup' background='grey' width='100vw' elevation='medium' justify='center' pad='small'>
                <ChatIcon color='white' />
                <Text weight='bold' color='white'>
                    Chat app
                </Text>
            </Header>
            <Main pad='xlarge' flex width='100vw' align='center' justify='center'>
                {!joined ? <JoinBox onSubmit={() => setJoined(true)} /> : <Chat onExit={() => {}} />}
            </Main>
        </>
    );
}

export default App;
