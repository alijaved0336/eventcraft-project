import { ApolloClient, InMemoryCache } from '@apollo/client';
import { linkChain } from './links';

/**
 * Apollo Client instance configured with a robust auth link chain for token renewal.
 */
export const apolloClient = new ApolloClient({
  link: linkChain,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Field policies can be added here
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
