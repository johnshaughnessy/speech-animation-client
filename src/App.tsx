import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect, send, onConnect, on } from "./utils/socket";
import { setSocket } from "./store/appSlice";
import store from "./store";
import nonSerializableState from "./utils/nonSerializableState";

function App() {
  const socket = useSelector((state) => state.app.socket);
  const dispatch = useDispatch();

  if (!socket) {
    const sessionId = Math.random().toString(36).substring(7);
    const socket = connect(`wss://localhost:6443/ws`, sessionId);
    dispatch(setSocket(socket.sessionId));
    nonSerializableState.socket = socket;

    on(socket, "echo", (data) => {
      console.log(data);
    });

    onConnect(socket, () => {
      send(socket, "echo", { foo: "bar" });
    });
  }

  return (
    <div className="font-bold text-green-500">
      <h1>Hello, world!</h1>
    </div>
  );
}

export default App;
