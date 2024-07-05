// Import the word list directly
import wordListRaw from "../assets/five_letter_words.txt";

let wordList = [];

const loadWordList = async () => {
  try {
    const fileUri = `${FileSystem.documentDirectory}five_letter_words.txt`;
    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    wordList = fileContent.split("\n").map((word) => word.trim().toLowerCase());
  } catch (error) {
    console.error("Error loading word list:", error);
    // Fallback to a small list if file can't be read
    wordList = ["apple", "beach", "chair", "dance", "eagle"];
  }
};

// Call this function when your app starts
loadWordList();

export const generateSecretWord = () => {
  if (wordList.length === 0) {
    console.warn("Word list is empty. Using fallback word.");
    return "apple";
  }
  return wordList[Math.floor(Math.random() * wordList.length)];
};

export const countCommonLetters = (word1, word2) => {
  const set1 = new Set(word1.toLowerCase());
  const set2 = new Set(word2.toLowerCase());
  return [...set1].filter((letter) => set2.has(letter)).length;
};

export const isValidGuess = (guess) => {
  return guess.length === 5 && /^[a-zA-Z]+$/.test(guess);
};

export const isWordInList = (word) => {
  return wordList.includes(word.toLowerCase());
};
