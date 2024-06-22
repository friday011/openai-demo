import { readFileSync, writeFileSync } from "fs";
import OpenAI from "openai";
import { join } from "path";

const openai = new OpenAI();

/**
 * Open AI embeddings
 */

type DataWithEmbeddings = {
  input: string;
  embedding: number[];
};

const generateEmbeddings = async (input: string | string[]) => {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: input
  });

  return response;
};

export function loadJSONData<T>(fileName: string): T {
  const path = join(__dirname, fileName);
  const rawData = readFileSync(path);
  return JSON.parse(rawData.toString());
}

function saveDataToJsonFile(data: any, fileName: string) {
  const dataString = JSON.stringify(data);
  const dataBuffer = Buffer.from(dataString);
  const path = join(__dirname, fileName);
  writeFileSync(path, dataBuffer);
  console.log(`saved data to ${fileName}`);
}

// STEP #1
// What are we doing?
// We are generating embeddings of certain words from "data.json" file
// and storing them in the file "dataWithEmbeddings.json" in a format
// that couples the word and it's embeddings together in an object
const saveDataWithEmbeddings = async () => {
  const data = loadJSONData<string[]>("data.json");

  const embeddings = await generateEmbeddings(data);

  const dataWithEmbeddings: DataWithEmbeddings[] = [];

  for (let i = 0; i < data.length; i++) {
    dataWithEmbeddings.push({
      input: data[i],
      embedding: embeddings.data[i].embedding
    });
  }

  saveDataToJsonFile(dataWithEmbeddings, "dataWithEmbeddings.json");
};

// STEP #2
// What are we doing?
// We are calculating similarity against a variable "input" and testing out that out of the words
// mentioned in the "data.json" file, which one has the highest level of similarity with the input variable
const main = async () => {
  const dataWithEmbeddings = loadJSONData<DataWithEmbeddings[]>(
    "dataWithEmbeddings.json"
  );

  const input = "animal";

  const inputEmbedding = await generateEmbeddings(input);

  const similarities: {
    input: string;
    similarity: number;
  }[] = [];

  for (const entry of dataWithEmbeddings) {
    // You can change the similarity algo to cosine or dotProduct and check results
    const similarity = cosineSimilarity(
      entry.embedding,
      inputEmbedding.data[0].embedding
    );
    similarities.push({
      input: entry.input,
      similarity
    });
  }

  console.log("Similarities array", similarities);

  console.log(`Similarity of ${input} with:`);

  const sortedSimilarities = similarities.sort(
    (a, b) => b.similarity - a.similarity
  );
  sortedSimilarities.forEach(similarity => {
    console.log(`${similarity.input}: ${similarity.similarity}`);
  });
};

function dotProduct(a: number[], b: number[]) {
  return a.map((value, index) => value * b[index]).reduce((a, b) => a + b, 0);
}

function cosineSimilarity(a: number[], b: number[]) {
  const product = dotProduct(a, b);
  const aMagnitude = Math.sqrt(
    a.map(value => value * value).reduce((a, b) => a + b, 0)
  );
  const bMagnitude = Math.sqrt(
    b.map(value => value * value).reduce((a, b) => a + b, 0)
  );
  return product / (aMagnitude * bMagnitude);
}

main();
