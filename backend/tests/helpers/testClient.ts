import jwt from 'jsonwebtoken';
import { config } from '../src/config';
import { buildApolloContext } from '../src/graphql/context';
import { checkInResolvers } from '../src/graphql/resolvers/checkIn.resolver';
// Note: using the actual Apollo server setup if necessary, but here we can just invoke logic directly 
// or mock the server execution. 
// Given the simplicity, we'll return a token generator and direct context builder.

export function getAuthToken(user: any) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role },
    config.jwt.accessSecret,
    { expiresIn: '15m' }
  );
}

export function createMockContext(user: any) {
  return {
    user: user ? { id: user._id.toString(), userId: user._id.toString(), email: user.email, role: user.role } : null,
    req: {},
    res: {},
    userAgent: 'test-agent',
  };
}
