import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import {
  generateSecretWord,
  countCommonLetters,
  isValidGuess,
  isWordInList,
} from "../utils/gameLogic";
import AlphabetScratchpad from "./AlphabetScratchpad";

export default function GameScreen() {
  const [secretWord, setSecretWord] = useState("");
  const [currentGuess, setCurrentGuess] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [usedLetters, setUsedLetters] = useState([]);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const newSecretWord = generateSecretWord();
    setSecretWord(newSecretWord);
    setCurrentGuess("");
    setGuesses([]);
    setFeedback("");
    setGameOver(false);
    setUsedLetters([]);
    console.log("Secret word:", newSecretWord); // For testing purposes
  };

  const handleKeyPress = (key) => {
    if (gameOver) return;

    if (key === "DELETE") {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (key === "ENTER") {
      handleGuess();
    } else if (key === "CLEAR") {
      setCurrentGuess("");
      setUsedLetters([]);
    } else if (currentGuess.length < 5) {
      setCurrentGuess((prev) => prev + key.toLowerCase());
    }
  };

  const handleGuess = () => {
    if (currentGuess.length !== 5) {
      setFeedback("Please enter a 5-letter word.");
      return;
    }

    if (!isValidGuess(currentGuess) || !isWordInList(currentGuess)) {
      setFeedback("Hm, I don't know that word. Please try another.");
      return;
    }

    const commonCount = countCommonLetters(secretWord, currentGuess);
    const newGuess = { word: currentGuess, commonCount };
    const newGuesses = [...guesses, newGuess];
    setGuesses(newGuesses);

    // Update used letters
    setUsedLetters((prev) => [
      ...new Set([...prev, ...currentGuess.split("")]),
    ]);

    if (currentGuess.toLowerCase() === secretWord.toLowerCase()) {
      setFeedback("Congratulations! You guessed the word!");
      setGameOver(true);
    } else {
      setFeedback(
        `Your guess has ${commonCount} letter(s) in common with the secret word.`
      );
    }

    setCurrentGuess("");

    if (newGuesses.length >= 99) {
      setFeedback(
        `Game over. You've reached the maximum number of guesses. The word was ${secretWord}.`
      );
      setGameOver(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Jotto Game</Text>
      <Text style={styles.guessCount}>Guesses: {guesses.length}/99</Text>
      <ScrollView style={styles.guessContainer}>
        {guesses.map((guess, index) => (
          <View key={index} style={styles.guessRow}>
            <Text style={styles.guessWord}>{guess.word}</Text>
            <Text style={styles.commonCount}>{guess.commonCount}</Text>
          </View>
        ))}
        <View style={styles.guessRow}>
          <Text style={styles.guessWord}>{currentGuess}</Text>
        </View>
      </ScrollView>
      <Text style={styles.feedback}>{feedback}</Text>
      <AlphabetScratchpad
        onKeyPress={handleKeyPress}
        currentGuess={currentGuess}
        usedLetters={usedLetters}
      />
      {gameOver && (
        <TouchableOpacity style={styles.button} onPress={startNewGame}>
          <Text style={styles.buttonText}>New Game</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5FCFF",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  guessCount: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  guessContainer: {
    flex: 1,
    marginBottom: 20,
  },
  guessRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#d3d6da",
  },
  guessWord: {
    fontSize: 18,
    fontWeight: "bold",
  },
  commonCount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "green",
  },
  feedback: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
});
