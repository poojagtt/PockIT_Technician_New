import {configureStore} from '@reduxjs/toolkit';
import AppReducer from './app';
import {
  useDispatch as useAppDispatch,
  useSelector as AppSelector,
  TypedUseSelectorHook,
} from 'react-redux';
import PartReducer from './part';
export const store = configureStore({
  reducer: {
    app: AppReducer,
    part: PartReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useDispatch = () => useAppDispatch<AppDispatch>();
export const useSelector: TypedUseSelectorHook<RootState> = AppSelector;
