import { firestore, rtdb } from "./db";
import * as express from "express";
import * as cors from "cors";
import { nanoid } from "nanoid";

const port = process.env.PORT || 1234;
const app = express();

app.use(express.json());
app.use(cors());

const userCollection = firestore.collection("users");
const roomsCollection = firestore.collection("rooms");
// parte del chatroom (chat en vivo)

app.post("/messages/:rtdbRoomId", (req, res) => {
  const { rtdbRoomId } = req.params;

  const chatRoomRef = rtdb.ref("/rooms/" + rtdbRoomId.toString() + "/messages");
  chatRoomRef.push(req.body, () => {
    res.json("todo ok");
  });
});

// parte del sign up y sign in

// se puede hacer así
// userCollection.doc('1234');
// o así, son lo mismo
// const doc = firestore.doc('users/1234');

// sing up
app.post("/signup", (req, res) => {
  const { email } = req.body;
  const { name } = req.body;

  userCollection.where("email", "==", email)
  .get().then((searchRes) => {
    if (searchRes.empty) {
      
      userCollection.add({
          email,
          name
        }).then((newUserRef) => {
          res.json({
            id: newUserRef.id,
            new: true
          });
        });
      } else {
        res.status(400).json({
          message: "user already exists",
        })
      }
  });
});

// authentication
app.post("/auth", (req, res) => {
  // esto es lo mismo que esto == const email = req.body.email;
  const { email } = req.body;
  
  userCollection.where("email", "==", email)
  .get().then((searchRes) => {
    if (searchRes.empty) {
    
      res.status(404).json({
        message: "not found",
      });
      } else {
        res.json({
         id: searchRes.docs[0].id,
        });
      }
  });

});


app.post("/rooms", (req, res) => {
  const { userId } = req.body;

  userCollection
  .doc(userId.toString())
  .get().then((doc) => {
    if(doc.exists) {
      const roomRef = rtdb.ref("rooms/" + nanoid());

      roomRef.set({
        messages: [],
        from: userId,
      }).then(() => {
        const roomLongId = roomRef.key;
        const roomId = 1000 + Math.floor(Math.random() * 999);

        roomsCollection.doc(roomId.toString())
        .set({
          rtdbRoomId: roomLongId,
        })
        .then(() => {
          res.json({
            roomId: roomId,
          });
        });
      });
    } else {
      res.status(401).json({
        message: "no existis",
      });
    }
  });
});

app.get("/rooms/:roomId", (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.query;

  userCollection
  .doc(userId.toString())
  .get().then((doc) => {
    if(doc.exists) {

      roomsCollection
      .doc(roomId.toString())
      .get()
      .then((doc) => {
        const data = doc.data();
        res.json(data);
      });

    } else {
      res.status(401).json({
        message: "no existis",
      });
    }
  });
});

app.listen(port, () => {
  console.log(`iniciado en http://localhost:${port}`);
});