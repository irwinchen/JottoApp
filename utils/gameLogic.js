// A small list of 5-letter words. In a real game, you'd want a much larger list.
const wordList = [
  "apple",
  "beach",
  "chair",
  "dance",
  "eagle",
  "flame",
  "grape",
  "house",
  "ivory",
  "jelly",
];

export const generateSecretWord = () => {
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
