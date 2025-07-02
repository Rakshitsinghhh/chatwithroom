"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
const allusers = [];
wss.on("connection", (ws) => {
    console.log("connected to server");
    ws.on("message", (msg) => {
        const smsg = JSON.parse(msg.toString());
        if (smsg.type === "join") {
            const roomID = smsg.payload.roomId;
            // ✅ Ensure uniqueness: Remove existing socket if present
            const existingIndex = allusers.findIndex((u) => u.socket === ws);
            if (existingIndex !== -1) {
                allusers[existingIndex].room = roomID; // Just update room
            }
            else {
                allusers.push({ socket: ws, room: roomID });
            }
            console.log("User joined room:", roomID);
        }
        if (smsg.type === "chat") {
            let roomid = null;
            for (let i = 0; i < allusers.length; i++) {
                if (ws === allusers[i].socket) {
                    roomid = allusers[i].room;
                    break;
                }
            }
            if (roomid) {
                for (let i = 0; i < allusers.length; i++) {
                    if (allusers[i].room === roomid) {
                        allusers[i].socket.send(smsg.payload.message);
                    }
                }
            }
        }
    });
    // ✅ Optional: Remove socket on disconnect
    ws.on("close", () => {
        const index = allusers.findIndex((u) => u.socket === ws);
        if (index !== -1) {
            allusers.splice(index, 1);
            console.log("User disconnected and removed");
        }
    });
});
