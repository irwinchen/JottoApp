const SERVER_URL = "https://54.210.190.155:3002";

let wordList = [];

const loadWordList = async () => {
  try {
    const response = await fetch(`${SERVER_URL}/words`);
    if (!response.ok) {
      throw new Error("Failed to fetch word list");
    }
    const words = await response.text();
    wordList = words.split("\n").map((word) => word.trim().toLowerCase());
    console.log(`Loaded ${wordList.length} words`);
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
  if (wordList.length === 0) {
    console.warn("Word list is empty when checking isWordInList");
  }
  return wordList.includes(word.toLowerCase());
};
// At the end of the file
export const ensureWordListLoaded = async () => {
  if (wordList.length === 0) {
    await loadWordList();
  }
};
