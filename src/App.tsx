import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect, send, onConnect, on } from "./utils/socket";
import { connectWebRTC } from "./utils/webrtc";
import { setSessionId, setSocketConnected, incrementWebRTCEventCount } from "./store/appSlice";
import { WebSocketReadyState } from "./utils/socket";
import { setupWebRTC } from "./utils/webrtc";
import store from "./store";
import state from "./utils/nonSerializableState";

function App() {
  const dispatch = useDispatch();
  let sessionId = useSelector((state) => state.app.sessionId);
  const socketConnected = useSelector((state) => state.app.socketConnected);
  const webRTCEventCount = useSelector((state) => state.app.webRTCEventCount);
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(7);
    dispatch(setSessionId(sessionId));
  }

  if (socketConnected && !state.webRTC) {
    const socket = state.socket;
    state.webRTC = setupWebRTC(socket, () => {
      dispatch(incrementWebRTCEventCount());
    });
  }

  return (
    <div className="">
      <audio id="audio" autoPlay playsInline></audio>

      <div className="mb-8 flex flex-col justify-center">
        <p className="font-bold">Websocket</p>
        <p>
          {socketConnected && state.socket && state.socket.ws
            ? WebSocketReadyState[state.socket.ws.readyState].description
            : "WebSocket not connected"}
        </p>
        {!socketConnected && (
          <button
            className="w-max rounded-lg bg-blue-500 p-4 text-white hover:bg-blue-700"
            onClick={() => {
              console.log("Websocket connecting...");
              const socket = connect(`wss://localhost:6443/ws`, sessionId);
              console.log("Websocket connecting...");
              state.socket = socket;
              console.log("state.socket", state.socket);
              onConnect(socket, () => {
                console.log("Websocket connected");
                dispatch(setSocketConnected(true));
                send(socket, "echo", { foo: "bar" }); // Test send
              });
              on(socket, "echo", (data) => {
                console.log("Websocket received echo", data); // Test receive
              });
              on(socket, "disconnect", () => {
                dispatch(setSocketConnected(false));
              });
            }}
          >
            Connect WebSocket
          </button>
        )}
      </div>

      <div className="mb-8 flex flex-col justify-center">
        <p className="font-bold">WebRTC</p>
        <p>{state.webRTC && state.webRTC.pc ? "Peer Connection exists" : "No peer connection"}</p>
        {state.webRTC && state.webRTC.pc && (
          <button
            className="w-max rounded-lg bg-blue-500 p-4 text-white hover:bg-blue-700"
            onClick={() => {
              state.webRTC.stopWebRTC();
            }}
          >
            Disconnect WebRTC
          </button>
        )}
        {state.webRTC && !state.webRTC.pc && (
          <button
            className="w-max rounded-lg bg-blue-500 p-4 text-white hover:bg-blue-700"
            onClick={() => {
              state.webRTC.startWebRTC();
            }}
          >
            Connect WebRTC
          </button>
        )}
        {state.webRTC && state.webRTC.pc && (
          <p>
            {state.webRTC.pc.connectionState} {state.webRTC.pc.iceConnectionState} {state.webRTC.pc.iceGatheringState}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
