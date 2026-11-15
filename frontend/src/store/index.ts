import { configureStore } from '@reduxjs/toolkit';
import eventsReducer from '@/features/events/store/eventsSlice';

export const store = configureStore({
  reducer: {
    events: eventsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
