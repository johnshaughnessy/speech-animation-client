import { createSlice } from "@reduxjs/toolkit";

const slice = createSlice({
    name: "app",
    initialState: {
        sessionId: null,
        socketConnected: false,
        webRTCEventCount: 0,
    },
    reducers: {
        setSessionId: (state, action) => {
            state.sessionId = action.payload;
        },
        setSocketConnected: (state, action) => {
            console.log("setSocketConnected", action.payload);
            state.socketConnected = action.payload;
        },
        incrementWebRTCEventCount: (state) => {
            state.webRTCEventCount += 1;
        },
    },
});

export const { setSessionId, setSocketConnected, incrementWebRTCEventCount } = slice.actions;
export default slice.reducer;
