import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

const model = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0.1,
  // verbose: true,
  openAIApiKey: process.env.OPENAI_SECRET_KEY
});

async function main() {
  // first way
  // const response = await model.invoke("Who was Bhagat Singh?");

  // batch way
  // const response = await model.batch([
  //   "How are you?",
  //   "Who was Mahatma Gandhi?"
  // ]);
  // console.log(response);

  // streaming way
  const response = await model.stream("Who was Bhagat Singh?");

  for await (const chunk of response) {
    console.log(chunk.content);
  }
}

main();
