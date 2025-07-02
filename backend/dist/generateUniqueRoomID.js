"use strict";
const allusers = [];
function generateUniqueRoomID(allusers) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let roomID;
    do {
        roomID = '';
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            roomID += characters[randomIndex];
        }
    } while (allusers.some(user => user.room === roomID)); // ensure uniqueness
    return roomID;
}
