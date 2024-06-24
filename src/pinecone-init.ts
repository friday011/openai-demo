import { pinecone } from "./pinecone/client";

const createIndex = async () => {
  const testIndex = await pinecone.createIndex({
    name: "test-first-index",
    dimension: 512,
    metric: "cosine",
    spec: {
      serverless: {
        cloud: "aws",
        region: "us-east-1"
      }
    }
  });

  console.log(testIndex);
};

const listIndexes = async () => {
  const indexes = await pinecone.listIndexes();

  console.log(JSON.stringify(indexes, null, 2));
};

// Pinecone Index Metadata type
type CoolMetadata = {
  coolness: number;
  reference: string;
};

const getIndex = () => {
  const index = pinecone.index<CoolMetadata>("test-first-index");

  return index;
};

const createNamespace = async () => {
  const index = getIndex();

  const ns = index.namespace("test-ns");
};

function generateNums(length: number) {
  return Array.from({ length }, () => Math.random());
}

const upsertVectors = async () => {
  const embeddings = generateNums(512);

  const index = getIndex();

  await index.upsert([
    {
      id: "id-001",
      values: embeddings,
      metadata: {
        coolness: 5,
        reference: "hello world"
      }
    }
  ]);
};

const queryVectors = async () => {
  const index = getIndex();

  const response = await index.query({
    id: "id-001",
    topK: 1,
    includeMetadata: true
  });

  console.log(response);
};

queryVectors();
