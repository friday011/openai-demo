import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";

import "dotenv/config";

const model = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0.1,
  openAIApiKey: process.env.OPENAI_SECRET_KEY
});

const data = [
  "My name is John",
  "My name is Bob",
  "My favourite food is pizza",
  "My favourite food is pasta"
];

const question = "What are my favourite foods?";

const main = async () => {
  const vectorstore = new MemoryVectorStore(
    new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_SECRET_KEY
    })
  );

  // store data
  await vectorstore.addDocuments(
    data.map(
      d =>
        new Document({
          pageContent: d
        })
    )
  );

  // create data retriever
  const retriever = vectorstore.asRetriever({
    k: 2
  });

  // get relevant documents
  const results = await retriever.invoke(question);
  const resultDocs = results.map(result => result.pageContent);

  // build template
  const template = ChatPromptTemplate.fromMessages([
    [
      "system",
      `Answer the users question based on the following context: {context}`
    ],
    ["user", `{input}`]
  ]);

  const chain = template.pipe(model);

  const response = await chain.invoke({
    input: question,
    context: resultDocs
  });

  console.log(JSON.stringify(response, null, 2));
};

main();
