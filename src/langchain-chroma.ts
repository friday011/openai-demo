import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import "dotenv/config";

const model = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0.1,
  openAIApiKey: process.env.OPENAI_SECRET_KEY
});

const question = "When was Arnold Bennett born?";

const main = async () => {
  // const vectorstore = new MemoryVectorStore(
  //   new OpenAIEmbeddings({
  //     apiKey: process.env.OPENAI_SECRET_KEY
  //   })
  // );

  // create data loader
  const loader = new PDFLoader("source.pdf", {
    splitPages: false
  });
  const docs = await loader.load();

  // split the docs
  const splitter = new RecursiveCharacterTextSplitter({
    // separators: [". \n"]
    chunkSize: 200,
    chunkOverlap: 20
  });

  const splittedDocs = await splitter.splitDocuments(docs);

  // store data
  const vectorStore = await Chroma.fromDocuments(
    splittedDocs,
    new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_SECRET_KEY
    }),
    {
      collectionName: "pdf-reader-demo",
      url: "http://localhost:8000"
    }
  );

  // create data retriever
  const retriever = vectorStore.asRetriever({
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
