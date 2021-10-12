"use strict";
exports.__esModule = true;
var db_1 = require("./db");
var express = require("express");
var cors = require("cors");
var nanoid_1 = require("nanoid");
var port = 1234;
var app = express();
app.use(express.json());
app.use(cors());
var userCollection = db_1.firestore.collection("users");
var roomsCollection = db_1.firestore.collection("rooms");
// parte del chatroom (chat en vivo)
app.post("/messages/:rtdbRoomId", function (req, res) {
    var rtdbRoomId = req.params.rtdbRoomId;
    var chatRoomRef = db_1.rtdb.ref("/rooms/" + rtdbRoomId.toString() + "/messages");
    chatRoomRef.push(req.body, function () {
        res.json("todo ok");
    });
});
// parte del sign up y sign in
// se puede hacer así
// userCollection.doc('1234');
// o así, son lo mismo
// const doc = firestore.doc('users/1234');
// sing up
app.post("/signup", function (req, res) {
    var email = req.body.email;
    var name = req.body.name;
    userCollection.where("email", "==", email)
        .get().then(function (searchRes) {
        if (searchRes.empty) {
            userCollection.add({
                email: email,
                name: name
            }).then(function (newUserRef) {
                res.json({
                    id: newUserRef.id,
                    "new": true
                });
            });
        }
        else {
            res.status(400).json({
                message: "user already exists"
            });
        }
    });
});
// authentication
app.post("/auth", function (req, res) {
    // esto es lo mismo que esto == const email = req.body.email;
    var email = req.body.email;
    userCollection.where("email", "==", email)
        .get().then(function (searchRes) {
        if (searchRes.empty) {
            res.status(404).json({
                message: "not found"
            });
        }
        else {
            res.json({
                id: searchRes.docs[0].id
            });
        }
    });
});
app.post("/rooms", function (req, res) {
    var userId = req.body.userId;
    userCollection
        .doc(userId.toString())
        .get().then(function (doc) {
        if (doc.exists) {
            var roomRef_1 = db_1.rtdb.ref("rooms/" + nanoid_1.nanoid());
            roomRef_1.set({
                messages: [],
                from: userId
            }).then(function () {
                var roomLongId = roomRef_1.key;
                var roomId = 1000 + Math.floor(Math.random() * 999);
                roomsCollection.doc(roomId.toString())
                    .set({
                    rtdbRoomId: roomLongId
                })
                    .then(function () {
                    res.json({
                        roomId: roomId
                    });
                });
            });
        }
        else {
            res.status(401).json({
                message: "no existis"
            });
        }
    });
});
app.get("/rooms/:roomId", function (req, res) {
    var userId = req.query.userId;
    var roomId = req.params.roomId;
    userCollection
        .doc(userId.toString())
        .get().then(function (doc) {
        if (doc.exists) {
            roomsCollection
                .doc(roomId.toString())
                .get()
                .then(function (doc) {
                var data = doc.data();
                res.json(data);
            });
        }
        else {
            res.status(401).json({
                message: "no existis"
            });
        }
    });
});
app.listen(port, function () {
    console.log("iniciado en http://localhost:" + port);
});
