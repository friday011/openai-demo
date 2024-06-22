import OpenAI from "openai";
import "dotenv/config";

import { chroma } from "./chroma/client";
import { OpenAIEmbeddingFunction } from "chromadb";

const openai = new OpenAI();

const embeddingFunc = new OpenAIEmbeddingFunction({
  openai_api_key: process.env.OPENAI_SECRET_KEY!,
  openai_model: "text-embedding-3-small"
});

const studentInfo = `Alexandra Thompson, a 19-year-old computer science sophomore with a 3.7 GPA,
is a member of the programming and chess clubs who enjoys pizza, swimming, and hiking
in her free time in hopes of working at a tech company after graduating from the University of Washington.`;

const clubInfo = `The university chess club provides an outlet for students to come together and enjoy playing
the classic strategy game of chess. Members of all skill levels are welcome, from beginners learning
the rules to experienced tournament players. The club typically meets a few times per week to play casual games,
participate in tournaments, analyze famous chess matches, and improve members' skills.`;

const universityInfo = `The University of Washington, founded in 1861 in Seattle, is a public research university
with over 45,000 students across three campuses in Seattle, Tacoma, and Bothell.
As the flagship institution of the six public universities in Washington state,
UW encompasses over 500 buildings and 20 million square feet of space,
including one of the largest library systems in the world.`;

const collectionName = "personal-info";

/**
 * createCollection function
 * @description Creates a collection in ChromaDB
 */
const createCollection = async () => {
  const response = await chroma.createCollection({
    name: collectionName,
    embeddingFunction: embeddingFunc
  });

  console.log(`${response.name} collection created`);
};

/**
 * getCollection function
 * @description Fetches a ChromaDB collection
 * @returns A ChromaDB colletion instance
 */
const getCollection = async () => {
  const response = await chroma.getCollection({
    name: collectionName,
    embeddingFunction: embeddingFunc
  });

  return response;
};

const populateCollection = async () => {
  await createCollection();

  const collection = await getCollection();

  await collection.add({
    ids: ["id-001", "id-002", "id-003"],
    documents: [studentInfo, clubInfo, universityInfo]
  });

  console.log(`Items have been added`);
};

const main = async () => {
  const question = "What does Alexandra Thompson like to do in her free time?";

  const collection = await getCollection();

  const result = await collection.query({
    queryTexts: question,
    nResults: 1
  });

  console.log(`ChromaDB query result`, result);

  const relevantInfo = result.documents[0][0];

  if (relevantInfo) {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.1,
      messages: [
        {
          role: "assistant",
          content: `Answer the next question using this information: ${relevantInfo}` // context injection
        },
        {
          role: "user",
          content: question
        }
      ]
    });

    console.log("OepnAI response call", response);

    console.log(`OpenAI response: `, response.choices[0].message.content);
  }
};

main();
