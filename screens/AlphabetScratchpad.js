import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

const KEYBOARD = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "DELETE"],
];

const AlphabetScratchpad = ({ onKeyPress, currentGuess, usedLetters }) => {
  return (
    <View style={styles.keyboard}>
      {KEYBOARD.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.key,
                key === "ENTER" && styles.enterKey,
                key === "DELETE" && styles.deleteKey,
                usedLetters.includes(key.toLowerCase()) && styles.usedKey,
              ]}
              onPress={() => onKeyPress(key)}
            >
              <Text style={styles.keyText}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.key, styles.clearKey]}
          onPress={() => onKeyPress("CLEAR")}
        >
          <Text style={styles.keyText}>CLEAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  keyboard: {
    marginTop: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  key: {
    width: 30,
    height: 44,
    borderRadius: 4,
    backgroundColor: "#d3d6da",
    justifyContent: "center",
    alignItems: "center",
    margin: 3,
  },
  keyText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  enterKey: {
    width: 50,
  },
  deleteKey: {
    width: 50,
  },
  usedKey: {
    backgroundColor: "#787c7e",
  },
  clearKey: {
    width: 80,
    backgroundColor: "#f0ad4e",
  },
});

export default AlphabetScratchpad;
