import OpenAI from "openai";
import "dotenv/config";
import { pinecone } from "./pinecone/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_SECRET_KEY
});
