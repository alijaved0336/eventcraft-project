import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client/react';
import { router } from './router';
import './index.css';
import { apolloClient } from './lib/apollo/client';
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <RouterProvider router={router} />
    </ApolloProvider>
  </React.StrictMode>,
);
