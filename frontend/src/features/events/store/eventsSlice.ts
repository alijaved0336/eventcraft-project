import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { eventsApi } from '@/api/eventsApi';
import { sessionsApi } from '@/api/sessionsApi';
import {
  Event,
  CreateEventRequest,
  UpdateEventRequest,
  Session,
  CreateSessionInput,
  UpdateSessionInput,
} from '../types';
import axios from 'axios';

interface EventsState {
  events: Event[];
  sessions: Session[];
  currentEvent: Event | null;
  eventsLoading: boolean;
  sessionsLoading: boolean;
  error: string | string[] | null;
  lastFetched: number | null;
}

const initialState: EventsState = {
  events: [],
  sessions: [],
  currentEvent: null,
  eventsLoading: false,
  sessionsLoading: false,
  error: null,
  lastFetched: null,
};

// Async Thunks
export const fetchEventDetails = createAsyncThunk(
  'events/fetchDetails',
  async (id: string, { rejectWithValue }) => {
    try {
      return await eventsApi.getDetails(id);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        return rejectWithValue(err.response.data?.message || 'Failed to fetch event details');
      }
      return rejectWithValue('An unexpected error occurred while fetching event details');
    }
  },
);

export const fetchEvents = createAsyncThunk(
  'events/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await eventsApi.getAll();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        return rejectWithValue(err.response.data?.message || 'Failed to fetch events');
      }
      return rejectWithValue('An unexpected error occurred while fetching events');
    }
  },
  {
    condition: (_, { getState }) => {
      const { events } = getState() as { events: EventsState };
      if (events.eventsLoading) {
        return false;
      }
      return true;
    },
  },
);

export const fetchFeaturedEvents = createAsyncThunk(
  'events/fetchFeatured',
  async (_, { rejectWithValue }) => {
    try {
      return await eventsApi.getFeatured();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        return rejectWithValue(err.response.data?.message || 'Failed to fetch featured events');
      }
      return rejectWithValue('An unexpected error occurred while fetching featured events');
    }
  },
  {
    condition: (_, { getState }) => {
      const { events } = getState() as { events: EventsState };
      if (events.eventsLoading) {
        return false;
      }
      return true;
    },
  },
);

export const createEvent = createAsyncThunk(
  'events/create',
  async (data: CreateEventRequest, { rejectWithValue }) => {
    try {
      return await eventsApi.create(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.data?.errors && Array.isArray(err.response.data.errors)) {
          return rejectWithValue(
            err.response.data.errors.map((e: { message: string }) => e.message),
          );
        }
        return rejectWithValue(err.response.data?.message || 'Failed to create event');
      }
      return rejectWithValue('An unexpected error occurred while creating event');
    }
  },
);

export const updateEvent = createAsyncThunk(
  'events/update',
  async ({ id, data }: { id: string; data: UpdateEventRequest }, { rejectWithValue }) => {
    try {
      return await eventsApi.update(id, data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        return rejectWithValue(err.response.data?.message || 'Failed to update event');
      }
      return rejectWithValue('An unexpected error occurred while updating event');
    }
  },
);

export const deleteEvent = createAsyncThunk(
  'events/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await eventsApi.delete(id);
      return id;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        return rejectWithValue(err.response.data?.message || 'Failed to delete event');
      }
      return rejectWithValue('An unexpected error occurred while deleting event');
    }
  },
);

// Session Thunks
export const fetchSessions = createAsyncThunk(
  'events/fetchSessions',
  async (eventId: string, { rejectWithValue }) => {
    try {
      return await sessionsApi.getByEventId(eventId);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        return rejectWithValue(err.response.data?.message || 'Failed to fetch sessions');
      }
      return rejectWithValue('An unexpected error occurred while fetching sessions');
    }
  },
);

export const createSession = createAsyncThunk(
  'events/createSession',
  async (data: CreateSessionInput, { rejectWithValue }) => {
    try {
      return await sessionsApi.create(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        return rejectWithValue(err.response.data?.message || 'Failed to create session');
      }
      return rejectWithValue('An unexpected error occurred while creating session');
    }
  },
);

export const updateSession = createAsyncThunk(
  'events/updateSession',
  async (
    { eventId, sessionId, data }: { eventId: string; sessionId: string; data: UpdateSessionInput },
    { rejectWithValue },
  ) => {
    try {
      return await sessionsApi.update(eventId, sessionId, data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        return rejectWithValue(err.response.data?.message || 'Failed to update session');
      }
      return rejectWithValue('An unexpected error occurred while updating session');
    }
  },
);

export const deleteSession = createAsyncThunk(
  'events/deleteSession',
  async ({ eventId, sessionId }: { eventId: string; sessionId: string }, { rejectWithValue }) => {
    try {
      await sessionsApi.delete(eventId, sessionId);
      return sessionId;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        return rejectWithValue(err.response.data?.message || 'Failed to delete session');
      }
      return rejectWithValue('An unexpected error occurred while deleting session');
    }
  },
);

interface BackendEvent extends Omit<Event, 'id'> {
  _id: string;
}

interface BackendSession extends Omit<Session, 'id'> {
  _id: string;
}

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearEventError: (state) => {
      state.error = null;
    },
    setCurrentEvent: (state, action: PayloadAction<Event | null>) => {
      state.currentEvent = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Featured Events
    builder.addCase(fetchFeaturedEvents.pending, (state) => {
      state.eventsLoading = true;
      state.error = null;
    });
    builder.addCase(
      fetchFeaturedEvents.fulfilled,
      (state, action: PayloadAction<BackendEvent[]>) => {
        state.eventsLoading = false;
        state.events = action.payload.map((event) => ({
          ...event,
          id: event._id,
        }));
        state.lastFetched = Date.now();
      },
    );
    builder.addCase(fetchFeaturedEvents.rejected, (state, action) => {
      state.eventsLoading = false;
      state.error = action.payload as string | string[];
    });

    // Fetch Events
    builder.addCase(fetchEvents.pending, (state) => {
      state.eventsLoading = true;
      state.error = null;
    });
    builder.addCase(fetchEvents.fulfilled, (state, action: PayloadAction<BackendEvent[]>) => {
      state.eventsLoading = false;
      state.events = action.payload.map((event) => ({
        ...event,
        id: event._id,
      }));
      state.lastFetched = Date.now();
    });
    builder.addCase(fetchEvents.rejected, (state, action) => {
      state.eventsLoading = false;
      state.error = action.payload as string | string[];
    });

    // Fetch Event Details
    builder.addCase(fetchEventDetails.pending, (state) => {
      state.eventsLoading = true;
      state.error = null;
    });
    builder.addCase(fetchEventDetails.fulfilled, (state, action) => {
      state.eventsLoading = false;
      const payload = action.payload as unknown as BackendEvent;
      const normalizedEvent: Event = {
        ...payload,
        id: payload._id,
      } as unknown as Event;
      state.currentEvent = normalizedEvent;
    });
    builder.addCase(fetchEventDetails.rejected, (state, action) => {
      state.eventsLoading = false;
      state.error = action.payload as string | string[];
    });

    // Create Event
    builder.addCase(createEvent.pending, (state) => {
      state.eventsLoading = true;
      state.error = null;
    });
    builder.addCase(createEvent.fulfilled, (state, action) => {
      state.eventsLoading = false;
      const payload = action.payload as unknown as BackendEvent;
      const normalizedEvent: Event = {
        ...payload,
        id: payload._id,
      } as unknown as Event;
      state.events.unshift(normalizedEvent);
      state.error = null;
    });
    builder.addCase(createEvent.rejected, (state, action) => {
      state.eventsLoading = false;
      state.error = action.payload as string | string[];
    });

    // Update Event
    builder.addCase(updateEvent.fulfilled, (state, action) => {
      const payload = action.payload as unknown as BackendEvent;
      const normalizedEvent: Event = {
        ...payload,
        id: payload._id,
      } as unknown as Event;
      const index = state.events.findIndex((e) => e.id === normalizedEvent.id);
      if (index !== -1) {
        state.events[index] = normalizedEvent;
      }
      if (state.currentEvent?.id === normalizedEvent.id) {
        state.currentEvent = normalizedEvent;
      }
    });

    // Delete Event
    builder.addCase(deleteEvent.fulfilled, (state, action: PayloadAction<string>) => {
      state.events = state.events.filter((e) => e.id !== action.payload);
      if (state.currentEvent?.id === action.payload) {
        state.currentEvent = null;
      }
    });

    // Session Handlers
    builder.addCase(fetchSessions.pending, (state) => {
      state.sessionsLoading = true;
      state.error = null;
    });
    builder.addCase(fetchSessions.fulfilled, (state, action: PayloadAction<BackendSession[]>) => {
      state.sessionsLoading = false;
      state.sessions = action.payload.map((session) => ({
        ...session,
        id: session._id,
      }));
    });
    builder.addCase(fetchSessions.rejected, (state, action) => {
      state.sessionsLoading = false;
      state.error = action.payload as string | string[];
    });

    builder.addCase(createSession.fulfilled, (state, action) => {
      const payload = action.payload as unknown as BackendSession;
      const normalizedSession: Session = {
        ...payload,
        id: payload._id,
      } as unknown as Session;
      state.sessions.push(normalizedSession);
      state.sessions.sort((a, b) => a.order - b.order);
    });

    builder.addCase(updateSession.fulfilled, (state, action) => {
      const payload = action.payload as unknown as BackendSession;
      const normalizedSession: Session = {
        ...payload,
        id: payload._id,
      } as unknown as Session;
      const index = state.sessions.findIndex((s) => s.id === normalizedSession.id);
      if (index !== -1) {
        state.sessions[index] = normalizedSession;
      }
      state.sessions.sort((a, b) => a.order - b.order);
    });

    builder.addCase(deleteSession.fulfilled, (state, action) => {
      state.sessions = state.sessions.filter((s) => s.id !== action.payload);
    });
  },
});

export const { clearEventError, setCurrentEvent } = eventsSlice.actions;
export default eventsSlice.reducer;
