import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { pinecone } from "./pinecone/client";
import { PineconeStore } from "@langchain/pinecone";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";

import "dotenv/config";

const model = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0.1,
  openAIApiKey: process.env.OPENAI_SECRET_KEY
});

const question = "What is NL Sena?";

const INDEX_NAME = "web-scaper-project";

const createIndex = async () => {
  const index = await pinecone.createIndex({
    name: INDEX_NAME,
    dimension: 1536,
    metric: "cosine",
    spec: {
      serverless: {
        cloud: "aws",
        region: "us-east-1"
      }
    }
  });

  console.log(`Created index: ${index}`);
};

const index = pinecone.Index(INDEX_NAME);

const storeDocs = async () => {
  // create data loader
  const loader = new CheerioWebBaseLoader("https://www.newslaundry.com/faq");
  const docs = await loader.load();

  // split the docs
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 20
  });
  const splittedDocs = await splitter.splitDocuments(docs);

  // store the docs in pinecone
  await PineconeStore.fromDocuments(
    splittedDocs,
    new OpenAIEmbeddings({ apiKey: process.env.OPENAI_SECRET_KEY }),
    {
      pineconeIndex: index,
      maxConcurrency: 5
    }
  );
};

const queryDocs = async () => {
  // create prompt template
  const template = ChatPromptTemplate.fromTemplate(`
    Answer the user's question based on the context provided.
    Context: {context}
    Question: {input}
  `);

  // create pinecone vectorStore instance
  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings({ apiKey: process.env.OPENAI_SECRET_KEY }),
    {
      pineconeIndex: index
    }
  );

  // create retriever that is responsibe for querying pinecone and fetching results
  const retriever = vectorStore.asRetriever({
    k: 2
  });

  // create
  const chain = await createStuffDocumentsChain({
    llm: model,
    prompt: template
  });

  const retrievalChain = await createRetrievalChain({
    combineDocsChain: chain,
    retriever: retriever
  });

  const response = await retrievalChain.invoke({
    input: question
  });

  console.log(JSON.stringify(response, null, 2));
};

queryDocs();
