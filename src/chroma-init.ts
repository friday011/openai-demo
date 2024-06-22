import { chroma } from "./chroma/client";
import { OpenAIEmbeddingFunction } from "chromadb";
import "dotenv/config";

const embeddingFunc = new OpenAIEmbeddingFunction({
  openai_api_key: process.env.OPENAI_SECRET_KEY!
});

const main = async () => {
  // const response = await chroma.createCollection({
  //   name: "test-data-with-embeds",
  //   embeddingFunction: embeddingFunc
  // });

  // console.log(response);

  const collection = await chroma.getCollection({
    name: "test-data-with-embeds",
    embeddingFunction: embeddingFunc
  });

  const addData = await collection.add({
    ids: ["id-001"],
    documents: ["hello world"]
  });

  console.log(addData);
};

main();
