import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EventCraft API Documentation',
      version: '1.0.0',
      description: 'Comprehensive documentation for EventCraft REST and GraphQL API',
      contact: {
        name: 'EventCraft Support',
        email: 'support@eventcraft.com',
      },
    },
    servers: [
      {
        url: 'https://eventcraftapi.vercel.app',
        description: 'Production server',
      },
      {
        url: `http://localhost:${config.port}`,
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        EventType: {
          type: 'string',
          enum: ['in_person', 'virtual', 'hybrid'],
        },
        EventStatus: {
          type: 'string',
          enum: ['draft', 'published', 'scheduled', 'ended', 'cancelled'],
        },
        EventVisibility: {
          type: 'string',
          enum: ['public', 'private', 'invite_only'],
        },
        SessionType: {
          type: 'string',
          enum: ['session', 'break', 'keynote', 'workshop'],
        },
        Location: {
          type: 'object',
          properties: {
            address: { type: 'string' },
            city: { type: 'string' },
            country: { type: 'string' },
            lat: { type: 'number' },
            lng: { type: 'number' },
          },
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            type: { $ref: '#/components/schemas/EventType' },
            status: { $ref: '#/components/schemas/EventStatus' },
            visibility: { $ref: '#/components/schemas/EventVisibility' },
            organizerId: { type: 'string' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            timezone: { type: 'string' },
            location: { $ref: '#/components/schemas/Location' },
            bannerImage: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            slug: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Session: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            eventId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            day: { type: 'number' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            speakerIds: { type: 'array', items: { type: 'string' } },
            track: { type: 'string' },
            order: { type: 'number' },
            type: { $ref: '#/components/schemas/SessionType' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateSessionInput: {
          type: 'object',
          required: ['eventId', 'title', 'day', 'startTime', 'endTime', 'order'],
          properties: {
            eventId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            day: { type: 'number' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            speakerIds: { type: 'array', items: { type: 'string' } },
            track: { type: 'string' },
            order: { type: 'number' },
            type: { $ref: '#/components/schemas/SessionType' },
          },
        },
        UpdateSessionInput: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            day: { type: 'number' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            speakerIds: { type: 'array', items: { type: 'string' } },
            track: { type: 'string' },
            order: { type: 'number' },
            type: { $ref: '#/components/schemas/SessionType' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Use absolute paths to ensure reliability in different environments (local vs Vercel)
  apis: [
    path.join(process.cwd(), 'src/rest/routes/**/*.{ts,js}'),
    path.join(process.cwd(), 'src/app.{ts,js}'),
    path.join(process.cwd(), 'dist/src/rest/routes/**/*.{ts,js}'),
    path.join(process.cwd(), 'dist/src/app.{ts,js}'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
