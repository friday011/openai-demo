import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import "dotenv/config";

const model = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0.1,
  openAIApiKey: process.env.OPENAI_SECRET_KEY
});

const question = "What is NL Sena?";

const main = async () => {
  const vectorstore = new MemoryVectorStore(
    new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_SECRET_KEY
    })
  );

  // create data loader
  const loader = new CheerioWebBaseLoader(
    "https://www.newslaundry.com/faq"
    // "https://js.langchain.com/v0.2/docs/introduction"
  );
  const docs = await loader.load();

  // split the docs
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 20
  });

  const splittedDocs = await splitter.splitDocuments(docs);

  // store data
  await vectorstore.addDocuments(splittedDocs);

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

  const parser = new StringOutputParser();

  const chain = template.pipe(model).pipe(parser);

  const response = await chain.invoke({
    input: question,
    context: resultDocs
  });

  console.log(response);
};

main();
