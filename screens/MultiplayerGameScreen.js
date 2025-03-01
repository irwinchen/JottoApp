import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
  FlatList,
} from "react-native";
import io from "socket.io-client";
import { ensureWordListLoaded } from "../utils/gameLogic";

// Replace with your actual server IP and port
const SERVER_URL = "wss://api.jotto.fun";

export default function MultiplayerGameScreen({ navigation }) {
  const [socket, setSocket] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [gameState, setGameState] = useState("menu");
  const [secretWord, setSecretWord] = useState("");
  const [currentGuess, setCurrentGuess] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const setupSocket = useCallback(() => {
    const newSocket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true,
      rejectUnauthorized: false,
    });

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setConnectionStatus("connected");
      newSocket.emit("getAvailableRooms");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setConnectionStatus("error");
      Alert.alert(
        "Connection Error",
        "Failed to connect to the game server. Please check your internet connection and try again."
      );
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected from server:", reason);
      setConnectionStatus("disconnected");
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("Reconnected to server after", attemptNumber, "attempts");
      setConnectionStatus("connected");
      newSocket.emit("getAvailableRooms");
    });

    newSocket.on("availableRooms", (rooms) => {
      console.log("Received available rooms: ", rooms);
      setAvailableRooms(rooms);
    });

    setupSocketListeners(newSocket);

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    const loadWordList = async () => {
      try {
        await ensureWordListLoaded();
        console.log("Word list loaded successfully");
      } catch (error) {
        console.error("Failed to load word list:", error);
      }
    };
    loadWordList();

    return setupSocket();
  }, [setupSocket]);

  const refreshAvailableRooms = useCallback(() => {
    if (socket && connectionStatus === "connected") {
      console.log("Manually refreshing available rooms...");
      socket.emit("getAvailableRooms");
    } else {
      console.log("Cannot refresh rooms. Socket status:", connectionStatus);
      Alert.alert(
        "Cannot Refresh",
        "Not connected to the server. Please check your internet connection."
      );
    }
  }, [socket, connectionStatus]);

  useEffect(() => {
    const loadWordList = async () => {
      try {
        await ensureWordListLoaded();
        console.log("Word list loaded successfully");
      } catch (error) {
        console.error("Failed to load word list:", error);
      }
    };
    loadWordList();
  }, []);

  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true,
      rejectUnauthorized: false,
    });

    newSocket.on("connect", () => {
      console.log("Connected to server");
      console.log("Requesting available rooms...");
      newSocket.emit("getAvailableRooms");
      setSocket(newSocket);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error description:", error.description);
      console.error("Error stack:", error.stack);
    });

    newSocket.on("availableRooms", (rooms) => {
      console.log("Received available rooms: ", rooms);
      setAvailableRooms(rooms);
    });
    setupSocketListeners(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const [winnerMessage, setWinnerMessage] = useState({ text: "", color: "" });
  const setupSocketListeners = (socket) => {
    socket.on("availableRooms", (rooms) => {
      setAvailableRooms(rooms);
    });

    socket.on("roomCreated", (code) => {
      setRoomCode(code);
      setGameState("waiting");
      setFeedback(`Game created. Share this code with your friend: ${code}`);
    });

    socket.on("roomJoined", (code) => {
      setRoomCode(code);
      setGameState("waiting");
      setFeedback("Joined the game. Waiting for the game to start...");
    });

    socket.on("waitingForWords", () => {
      setGameState("chooseWord");
      setFeedback("Both players joined. Choose your secret word.");
      setSecretWord("");
    });

    socket.on("invalidWord", (message) => {
      console.log("Received invalidWord event:", message);
      setIsSubmitting(false);
      setFeedback(message || "Invalid word. Please try again.");
    });

    socket.on("wordAccepted", () => {
      setFeedback("Word accepted! Waiting for other player...");
      setIsSubmitting(false);
    });

    socket.on("gameStart", ({ firstPlayer }) => {
      setGameState("playing");
      setIsMyTurn(firstPlayer === socket.id);
      setFeedback(
        firstPlayer === socket.id
          ? "Game started! Your turn to guess."
          : "Game started! Opponent's turn to guess."
      );
    });

    socket.on("guessResult", ({ player, word, commonCount, nextTurn }) => {
      setGuesses((prev) => [...prev, { player, word, commonCount }]);
      setIsMyTurn(nextTurn === socket.id);
      setFeedback(
        nextTurn === socket.id
          ? "Your turn to guess."
          : "Opponent's turn to guess."
      );
    });

    socket.on("gameOver", ({ winner, word }) => {
      setGameState("gameOver");
      if (winner === socket.id) {
        setWinnerMessage({
          text: `Congratulations! You won!`,
          color: "#4CAF50",
        });
      } else {
        setWinnerMessage({
          text: `You lost. Better luck next time!`,
          color: "#FF0000",
        });
      }
      setFeedback(`The word was: ${word}`);
    });

    socket.on("playerDisconnected", () => {
      setGameState("menu");
      setFeedback("The other player disconnected. Game over.");
      Alert.alert("Player Disconnected", "The other player has left the game.");
    });
  };

  const createRoom = () => {
    if (socket) {
      socket.emit("createRoom");
    }
  };

  const joinRoom = () => {
    if (socket && selectedRoom) {
      socket.emit("joinRoom", selectedRoom.code);
    } else {
      Alert.alert("Error", "Please select a game to join");
    }
  };

  const submitSecretWord = () => {
    if (secretWord.length !== 5) {
      Alert.alert("Error", "Your secret word must be 5 letters long.");
      return;
    }
    if (socket && roomCode) {
      setIsSubmitting(true);
      setFeedback("Checking word...");
      socket.emit("submitWord", { roomCode, word: secretWord });

      // Add a timeout to handle cases where the server doesn't respond
      setTimeout(() => {
        if (isSubmitting) {
          setIsSubmitting(false);
          setFeedback("Server not responding. Please try again.");
        }
      }, 10000); // 10 seconds timeout
    }
  };

  const makeGuess = () => {
    if (currentGuess.length !== 5) {
      setFeedback("Please enter a 5-letter word.");
      return;
    }

    if (socket && roomCode) {
      socket.emit("makeGuess", { roomCode, guess: currentGuess });
      setCurrentGuess("");
    }
  };

  // Add a refresh button in your UI
  <TouchableOpacity style={styles.button} onPress={refreshAvailableRooms}>
    <Text style={styles.buttonText}>Refresh Games</Text>
  </TouchableOpacity>;

  const renderRoomItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.roomItem,
        selectedRoom &&
          selectedRoom.code === item.code &&
          styles.selectedRoomItem,
      ]}
      onPress={() => setSelectedRoom(item)}
    >
      <Text style={styles.roomItemText}>
        Game: {item.code} ({item.players}/2 players)
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Multiplayer Jotto</Text>
        <Text style={styles.connectionStatus}>Status: {connectionStatus}</Text>

        {gameState === "menu" && (
          <View style={styles.menuContainer}>
            <Text style={styles.subtitle}>Open Games:</Text>
            {availableRooms.length > 0 ? (
              <FlatList
                data={availableRooms}
                renderItem={renderRoomItem}
                keyExtractor={(item) => item.code}
                style={styles.roomList}
              />
            ) : (
              <Text style={styles.noGamesText}>
                No open games found. Try refreshing or create a new game!
              </Text>
            )}
            <TouchableOpacity
              style={styles.button}
              onPress={refreshAvailableRooms}
            >
              <Text style={styles.buttonText}>Refresh Games</Text>
            </TouchableOpacity>
            {availableRooms.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.button,
                  (!selectedRoom || selectedRoom.players === 2) &&
                    styles.disabledButton,
                ]}
                onPress={joinRoom}
                disabled={!selectedRoom || selectedRoom.players === 2}
              >
                <Text style={styles.buttonText}>Join Selected Game</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.button} onPress={createRoom}>
              <Text style={styles.buttonText}>Create New Game</Text>
            </TouchableOpacity>
          </View>
        )}

        {gameState === "waiting" && (
          <Text style={styles.feedback}>{feedback}</Text>
        )}

        {gameState === "chooseWord" && (
          <View>
            <Text style={styles.feedback}>{feedback}</Text>
            <TextInput
              style={styles.input}
              value={secretWord}
              onChangeText={setSecretWord}
              placeholder="Enter your 5-letter secret word"
              maxLength={5}
              editable={!isSubmitting}
              autoCorrect={false}
              spellCheck={false}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.disabledButton]}
              onPress={submitSecretWord}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? "Submitting..." : "Submit Secret Word"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {gameState === "playing" && (
          <View style={styles.gameContainer}>
            <Text style={styles.secretWordReminder}>
              Your secret word is: {secretWord}
            </Text>
            <Text style={styles.feedback}>{feedback}</Text>
            <View style={styles.guessContainer}>
              <TextInput
                style={styles.input}
                value={currentGuess}
                onChangeText={setCurrentGuess}
                placeholder="Enter your guess"
                maxLength={5}
                editable={isMyTurn}
                autoCorrect={false}
                spellCheck={false}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.button, !isMyTurn && styles.disabledButton]}
                onPress={makeGuess}
                disabled={!isMyTurn}
              >
                <Text style={styles.buttonText}>Guess</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.guessList}>
              {guesses.map((guess, index) => (
                <Text key={index} style={styles.guessItem}>
                  {guess.player === socket.id ? "You" : "Opponent"}:{" "}
                  {guess.word} - {guess.commonCount} common
                </Text>
              ))}
            </ScrollView>
          </View>
        )}
        {gameState === "gameOver" && (
          <View style={styles.gameOverContainer}>
            <Text style={[styles.gameOverText, { color: winnerMessage.color }]}>
              {winnerMessage.text}
            </Text>
            <Text style={styles.feedbackText}>{feedback}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setGameState("menu");
                setGuesses([]);
                setSecretWord("");
                setCurrentGuess("");
                setFeedback("");
                setWinnerMessage({ text: "", color: "" });
              }}
            >
              <Text style={styles.buttonText}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5FCFF",
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  menuContainer: {
    flex: 1,
  },
  roomList: {
    flex: 1,
    marginBottom: 20,
  },
  roomItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  selectedRoomItem: {
    backgroundColor: "#e6f3ff",
  },
  roomItemText: {
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  feedback: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  gameContainer: {
    flex: 1,
  },
  guessContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  guessList: {
    flex: 1,
  },
  guessItem: {
    fontSize: 16,
    marginBottom: 5,
  },
  noGamesText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
    color: "#666",
  },
  secretWordReminder: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  gameOverContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gameOverText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  feedbackText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  connectionStatus: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
    color: "#666",
  },
});
