export const authTypeDefs = `#graphql
  scalar DateTime

  type PermissionInfo {
    action: String!
    level:  String!
  }

  type User {
    id:            ID!
    _id:           ID!
    email:         String!
    name:          String!
    avatar:        String
    phone:         String
    role:          UserRole!
    permissions:   [PermissionInfo!]!
    emailVerified: Boolean!
    isActive:      Boolean!
    timezone:      String!
    lastLoginAt:   DateTime
    createdAt:     DateTime!
    updatedAt:     DateTime!
  }

  enum UserRole {
    super_admin
    admin
    organizer
    host
    attendee
    guest
  }

  type AuthPayload {
    user:        User!
    accessToken: String!
  }

  input RegisterInput {
    email:    String!
    password: String!
    name:     String!
    role:     UserRole!
    timezone: String
  }

  input LoginInput {
    email:    String!
    password: String!
  }

  extend type Query {
    me: User!
  }

  extend type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!):       AuthPayload!
    logout:                          Boolean!
    logoutAll:                       Boolean!
  }
`;
