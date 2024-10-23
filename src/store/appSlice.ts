import { createSlice } from "@reduxjs/toolkit";

const slice = createSlice({
    name: "app",
    initialState: {
        sessionId: null,
        socketConnected: false,
    },
    reducers: {
        setSessionId: (state, action) => {
            state.sessionId = action.payload;
        },
        setSocketConnected: (state, action) => {
            console.log("setSocketConnected", action.payload);
            state.socketConnected = action.payload;
        },
    },
});

export const { setSessionId, setSocketConnected } = slice.actions;
export default slice.reducer;
