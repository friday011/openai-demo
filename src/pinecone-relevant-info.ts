import { pinecone } from "./pinecone/client";
import OpenAI from "openai";
import "dotenv/config";

const openai = new OpenAI();

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

type Info = {
  info: string;
  reference: string;
  relevance: number;
};

const dataToEmbed: Info[] = [
  {
    info: studentInfo,
    reference: "Some student 123",
    relevance: 0.9
  },
  {
    info: clubInfo,
    reference: "Some club 456",
    relevance: 0.8
  },
  {
    info: universityInfo,
    reference: "Some university 789",
    relevance: 0.7
  }
];

const getIndex = () => {
  const index = pinecone.index<Info>("relevant-info-project");

  return index;
};

const storeEmbeddings = async () => {
  const index = getIndex();

  await Promise.all([
    dataToEmbed.map(async (data, i) => {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: data.info
      });

      const embedding = response.data[0].embedding;

      await index.upsert([
        {
          id: `id-${i}`,
          values: embedding,
          metadata: data
        }
      ]);
    })
  ]);
};

const queryEmbeddings = async (question: string) => {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: question
  });

  const questionEmbedding = response.data[0].embedding;

  const index = getIndex();

  const queryResult = await index.query({
    vector: questionEmbedding,
    topK: 1,
    includeMetadata: true
  });

  console.log(`Pinecone Query result: ${JSON.stringify(queryResult, null, 2)}`);

  return queryResult;
};

const QUESTION = "What does Alexandra Thompson like to do in her free time?";

const askOpenAI = async (question: string, relevantInfo: string) => {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0.1,
    messages: [
      {
        role: "assistant",
        content: `Answer the next question using this information: ${relevantInfo}`
      },
      {
        role: "user",
        content: question
      }
    ]
  });

  console.log(JSON.stringify(response, null, 2));

  console.log(`OpenAI answer: ${response.choices[0].message.content}`);
};

const main = async () => {
  const queryResult = await queryEmbeddings(QUESTION);
  const relevantInfo = queryResult.matches[0].metadata;

  if (relevantInfo) {
    await askOpenAI(QUESTION, relevantInfo.info);
  }
};

main();
