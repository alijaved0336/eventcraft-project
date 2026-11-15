import { createHttpLink, from, Observable } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { tokenStore } from '../auth/tokenStore';
import { refreshAccessToken } from '../auth/refreshToken';
import {
  ServerError,
  ServerParseError,
  FetchResult,
  Observable as ApolloObservable,
  Operation,
} from '@apollo/client';

interface AuthErrorResponse {
  graphQLErrors?: ReadonlyArray<{ extensions?: { code?: string } }>;
  networkError?: Error & { statusCode?: number };
  operation: Operation;
  forward: (op: Operation) => ApolloObservable<FetchResult>;
}

/**
 * Attaches 'Authorization: Bearer <token>' to every request if a token is present.
 */
export const tokenLink = setContext((_, { headers }) => {
  const token = tokenStore.get();
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

/**
 * Catch UNAUTHENTICATED errors, refresh the token, and retry the failed requests.
 */
export const authLink = onError((errorResponse: AuthErrorResponse) => {
  const { graphQLErrors, networkError, operation, forward } = errorResponse;
  let isUnauthenticated = false;

  if (graphQLErrors) {
    isUnauthenticated = graphQLErrors.some((e) => e.extensions?.code === 'UNAUTHENTICATED');
  } else if (
    (networkError as ServerError | ServerParseError)?.statusCode === 401 ||
    (networkError as unknown as { networkError?: { statusCode?: number } })?.networkError
      ?.statusCode === 401
  ) {
    isUnauthenticated = true;
  }

  if (!isUnauthenticated) return;

  // Avoid infinite retry loops
  const context = operation.getContext();
  if (context.isRetry) {
    console.error('Persistent GraphQL authentication failure. Logging out.');
    tokenStore.clear();
    window.dispatchEvent(new Event('auth:logout'));
    return;
  }

  // Refresh and retry
  return new Observable((observer) => {
    refreshAccessToken()
      .then((token) => {
        if (!token) {
          // If refresh returned nothing, it's a terminal auth failure
          throw new Error('No access token returned from refresh');
        }

        operation.setContext({
          ...context,
          isRetry: true,
        });

        const subscriber = forward(operation).subscribe(observer);
        return () => subscriber.unsubscribe();
      })
      .catch((err) => {
        console.error('GraphQL token refresh failure:', err);
        tokenStore.clear();
        window.dispatchEvent(new Event('auth:logout'));
        observer.error(err);
      });
  });
});

const apiUrl = import.meta.env.VITE_API_URL as string;

/**
 * Standard HTTP link with credentials set to 'include' for secure cookie handling.
 */
export const httpLink = createHttpLink({
  uri: `${apiUrl.replace(/\/$/, '')}/graphql`,
  credentials: 'include',
});

export const linkChain = from([authLink, tokenLink, httpLink]);
