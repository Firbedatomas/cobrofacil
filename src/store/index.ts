import { configureStore } from '@reduxjs/toolkit';
import productosReducer from './productosSlice';
import ventasReducer from './ventasSlice';
import cajaReducer from './cajaSlice';
import clientesReducer from './clientesSlice';

export const store = configureStore({
  reducer: {
    productos: productosReducer,
    ventas: ventasReducer,
    caja: cajaReducer,
    clientes: clientesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 