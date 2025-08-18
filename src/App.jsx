import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Chats from './pages/Chats';
import { NhostProvider } from '@nhost/react';
import { nhost } from './nhost';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://nqlsviljwkjxtpycwjsl.hasura.ap-south-1.nhost.run/v1/graphql', // replace with Hasura endpoint
  cache: new InMemoryCache(),
  headers: {
    'x-hasura-admin-secret': '7IGS$H1fNm&JhBPQC#mYrCG351@j^ogp', // replace if needed
  },
});

const App = () => {
  return (
    <ApolloProvider client={client}>
      <NhostProvider nhost={nhost}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/chats" element={<Chats />} />
        </Routes>
      </NhostProvider>
    </ApolloProvider>
  );
};

export default App;
