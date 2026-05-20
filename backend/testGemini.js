import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function test() {
  try {
    console.log("API KEY:", process.env.GOOGLE_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
    });

    const result = await model.generateContent("Say hello");
    const text = result.response.text();

    console.log("✅ SUCCESS:", text);
  } catch (err) {
    console.error("❌ ERROR:", err.message);
  }
}

test();