const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Load the dictionary
const dictionary = new Set(
  fs
    .readFileSync("five_letter_words.txt", "utf-8")
    .split("\n")
    .map((word) => word.trim().toLowerCase())
);

function isValidWord(word) {
  console.log(`Checking if word is valid: ${word}`);
  const result = dictionary.has(word.toLowerCase());
  console.log(`Word "${word}" is ${result ? "valid" : "invalid"}`);
  return result;
}

const httpsServer = https.createServer(
  {
    key: fs.readFileSync("/home/ec2-user/ssl/key.pem"),
    cert: fs.readFileSync("/home/ec2-user/ssl/cert.pem"),
  },
  app
);

const io = new Server(httpsServer, {
  cors: {
    origin: "https://main.d2zhi6x3eeonq9.amplifyapp.com",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

const games = new Map();

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getAvailableRooms() {
  return Array.from(games.entries())
    .filter(([_, game]) => game.players.length < 2)
    .map(([code, game]) => ({
      code,
      players: game.players.length,
    }));
}

function countCommonLetters(word1, word2) {
  const set1 = new Set(word1.toLowerCase());
  const set2 = new Set(word2.toLowerCase());
  return [...set1].filter((letter) => set2.has(letter)).length;
}

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);
  console.log("Client address:", socket.handshake.address);
  console.log("Transport:", socket.conn.transport.name);

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });

  // Emit available rooms to the newly connected client
  socket.emit("availableRooms", getAvailableRooms());

  socket.on("createRoom", () => {
    const roomCode = generateRoomCode();
    games.set(roomCode, {
      players: [{ id: socket.id, word: null }],
      currentTurn: null,
      guesses: [],
    });
    socket.join(roomCode);
    socket.emit("roomCreated", roomCode);
    io.emit("availableRooms", getAvailableRooms()); // Broadcast updated room list
    console.log(`Room created: ${roomCode}`);
  });

  socket.on("joinRoom", (roomCode) => {
    const game = games.get(roomCode);
    if (game && game.players.length < 2) {
      game.players.push({ id: socket.id, word: null });
      socket.join(roomCode);
      socket.emit("roomJoined", roomCode);
      if (game.players.length === 2) {
        io.to(roomCode).emit("waitingForWords");
        io.emit("availableRooms", getAvailableRooms()); // Broadcast updated room list
      }
      console.log(`Player ${socket.id} joined room ${roomCode}`);
    } else {
      socket.emit("joinError", "Room not found or full");
    }
  });

  socket.on("submitWord", ({ roomCode, word }) => {
    const game = games.get(roomCode);
    if (game) {
      if (isValidWord(word)) {
        const player = game.players.find((p) => p.id === socket.id);
        if (player) {
          player.word = word.toLowerCase();
          socket.emit("wordAccepted");

          if (game.players.every((p) => p.word)) {
            game.currentTurn = game.players[0].id;
            io.to(roomCode).emit("gameStart", {
              firstPlayer: game.currentTurn,
            });
          } else {
            socket.emit("waitingForOpponent");
          }
        }
      } else {
        socket.emit(
          "invalidWord",
          "The word is not in the dictionary. Please choose another word."
        );
      }
    } else {
      socket.emit("error", "Game not found");
    }
  });

  socket.on("makeGuess", ({ roomCode, guess }) => {
    const game = games.get(roomCode);
    if (game && game.currentTurn === socket.id && isValidWord(guess)) {
      const opponent = game.players.find((p) => p.id !== socket.id);
      const commonCount = countCommonLetters(opponent.word, guess);
      game.guesses.push({ player: socket.id, word: guess, commonCount });

      if (guess.toLowerCase() === opponent.word) {
        io.to(roomCode).emit("gameOver", {
          winner: socket.id,
          word: opponent.word,
        });
        games.delete(roomCode);
      } else {
        game.currentTurn = opponent.id;
        io.to(roomCode).emit("guessResult", {
          player: socket.id,
          word: guess,
          commonCount,
          nextTurn: opponent.id,
        });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    for (const [roomCode, game] of games.entries()) {
      const playerIndex = game.players.findIndex((p) => p.id === socket.id);
      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);
        if (game.players.length === 0) {
          games.delete(roomCode);
        }
        io.to(roomCode).emit("playerDisconnected", socket.id);
        io.emit("availableRooms", getAvailableRooms()); // Broadcast updated room list
        break;
      }
    }
  });
});

// Your existing Express routes (if any)
app.get("/", (req, res) => {
  console.log("Received request on root route");
  res.send("Jotto server is running");
});

app.get("/test", (req, res) => {
  res.send("Server is reachable");
});

const HTTPS_PORT = 3002;

httpsServer.listen(HTTPS_PORT, "0.0.0.0", () => {
  console.log(`HTTPS Server running on https://0.0.0.0:${HTTPS_PORT}`);
});

console.log("Server IP addresses:");
const networkInterfaces = require("os").networkInterfaces();
for (const interfaceName in networkInterfaces) {
  for (const interface of networkInterfaces[interfaceName]) {
    if (interface.family === "IPv4" && !interface.internal) {
      console.log(
        `  ${interfaceName}: https://${interface.address}:${HTTPS_PORT}`
      );
    }
  }
}
