import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";

import "dotenv/config";

const model = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0.1,
  // verbose: true,
  openAIApiKey: process.env.OPENAI_SECRET_KEY
});

const fromTemplate = async () => {
  const prompt = ChatPromptTemplate.fromTemplate(
    "Write a short description about the product: {product_name}"
  );

  const wholePrompt = await prompt.format({
    product_name: "Macbook Air M1"
  });

  console.log(wholePrompt);

  // creating a chain: connecting the model with the prompt
  // chains are smallest execution steps or building blocks in Langchain
  const chain = prompt.pipe(model);

  const response = await chain.invoke({
    product_name: "iPhone 13"
  });

  console.log(JSON.stringify(response, null, 2));
};

const fromMessage = async () => {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Write a short description about the product name provided by the user"
    ],
    ["human", "{product_name}"]
  ]);

  const chain = prompt.pipe(model);

  const response = await chain.invoke({
    product_name: "Macbook Air M1"
  });

  console.log(response.content);
};

fromMessage();
