const fs = require("fs");
const path = require("path");

// This function loads words from a file. You should create a file named 'five_letter_words.txt'
// containing all valid 5-letter words from the OSPD, one word per line.
function loadDictionary() {
  const filePath = path.join(__dirname, "five_letter_words.txt");
  const words = fs
    .readFileSync(filePath, "utf-8")
    .split("\n")
    .map((word) => word.trim().toLowerCase());
  return new Set(words);
}

const validWords = loadDictionary();

function generateSecretWord() {
  const wordsArray = Array.from(validWords);
  return wordsArray[Math.floor(Math.random() * wordsArray.length)];
}

function countCommonLetters(word1, word2) {
  const set1 = new Set(word1.toLowerCase());
  const set2 = new Set(word2.toLowerCase());
  return [...set1].filter((letter) => set2.has(letter)).length;
}

function isValidWord(word) {
  return validWords.has(word.toLowerCase());
}

module.exports = {
  generateSecretWord,
  countCommonLetters,
  isValidWord,
};
