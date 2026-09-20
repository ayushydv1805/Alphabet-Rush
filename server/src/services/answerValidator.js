function createAnswerValidator(openai) {
  return async function validateAnswer(answer, category, letter) {
    if (!answer || !answer.trim()) {
      return false;
    }

    try {
      const response = await openai.responses.create({
        model: "gpt-5.6-luna",
        input: `You are validating a word game answer.

Category: ${category}
Required starting letter: ${letter}
Answer: ${answer.trim()}

Return ONLY one number:

1 = The answer is a genuine and commonly understandable example of the category AND starts with the required letter.

0 = The answer is not a genuine example of the category OR does not start with the required letter.

Examples:

Animal + A + Ant = 1
Animal + A + Apple = 0
Food + A + Apple = 1
Place + A + Agra = 1
Food + A + Agra = 0
Name + A + Amit = 1
Thing + A + Apple = 1
Thing + A + Ant = 0`
      });

      return response.output_text.trim() === "1";
    } catch (error) {
      console.error(
        "AI validation error for " + category + ":",
        error.message
      );
      return false;
    }
  };
}

module.exports = { createAnswerValidator };
