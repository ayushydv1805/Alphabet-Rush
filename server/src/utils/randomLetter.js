function getRandomLetter() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  return letters[
    Math.floor(Math.random() * letters.length)
  ];
}

module.exports = { getRandomLetter };
