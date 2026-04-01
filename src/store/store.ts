import { legacy_createStore as createStore } from "redux";
import { orderBookReducer } from "./orderBookReducer";

export const store = createStore(orderBookReducer);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
