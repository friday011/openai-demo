import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  StringOutputParser,
  CommaSeparatedListOutputParser
} from "@langchain/core/output_parsers";
import { StructuredOutputParser } from "langchain/output_parsers";

import "dotenv/config";

const model = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0.1,
  // verbose: true,
  openAIApiKey: process.env.OPENAI_SECRET_KEY
});

const stringParser = async () => {
  const prompt = ChatPromptTemplate.fromTemplate(
    "Write a short description about the product: {product_name}"
  );

  const parser = new StringOutputParser();

  const chain = prompt.pipe(model).pipe(parser);

  const response = await chain.invoke({
    product_name: "iPhone 13"
  });

  console.log(response);
};

const commaSeparatedParser = async () => {
  const prompt = ChatPromptTemplate.fromTemplate(
    "Write 5 short points, separated by commas, about the product: {product_name}"
  );

  const parser = new CommaSeparatedListOutputParser();

  const chain = prompt.pipe(model).pipe(parser);

  const response = await chain.invoke({
    product_name: "iPhone 13"
  });

  console.log(response);
};

const structuredParser = async () => {
  const prompt = ChatPromptTemplate.fromTemplate(`
  Extract information from the following phrase.
  Formatting instructions: {format_instructions}
  Phrase: {phrase}
    `);

  const parser = StructuredOutputParser.fromNamesAndDescriptions({
    name: "The name of the person",
    likes: "What the person likes"
  });

  const chain = prompt.pipe(model).pipe(parser);

  const response = await chain.invoke({
    phrase: "Rishabh likes margherita pizza",
    format_instructions: parser.getFormatInstructions()
  });

  console.log(JSON.stringify(response, null, 2));
};

structuredParser();
