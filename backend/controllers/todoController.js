import { GoogleGenerativeAI } from "@google/generative-ai";
import Todo from "../models/TodoModel.js";
import dotenv from "dotenv";
import * as chrono from "chrono-node";
import nodemailer from "nodemailer";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// ✅ Email Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Send Email
const sendSummaryEmail = async (email, summary) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "📌 Meeting Summary",
      text: summary,
    });
    console.log("📧 Email sent");
  } catch (err) {
    console.log("❌ Email error:", err.message);
  }
};

// ✅ SAFE AI FUNCTION (NO CRASH EVER)
const safeAI = async (prompt) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.log("❌ AI failed → using fallback");
    return null; // IMPORTANT
  }
};

// ✅ MAIN FUNCTION
export const extractTodosAndSummary = async (req, res) => {
  try {
    const { paragraph, email } = req.body;

    if (!paragraph || !email) {
      return res.status(400).json({ message: "Missing data" });
    }

    console.log("🔥 API HIT");

    // 🧠 TRY AI
    const aiTodos = await safeAI(
      `Extract tasks as JSON array from: "${paragraph}"`
    );

    const aiSummary = await safeAI(
      `Summarize this: "${paragraph}"`
    );

    let todos = [];
    let summary = "No summary available.";

    // ✅ If AI works
    if (aiTodos) {
      try {
        const parsed = JSON.parse(aiTodos);
        if (Array.isArray(parsed)) {
          todos = parsed;
        }
      } catch {}
    }

    if (aiSummary) {
      summary = aiSummary;
    }

    // ✅ FALLBACK (if AI fails)
    if (todos.length === 0) {
      console.log("⚠️ Using fallback tasks");

      todos = [
        {
          task: paragraph.slice(0, 50),
          deadline: "tomorrow",
        },
      ];
    }

    // ✅ Parse dates
    const parsedTodos = todos.map((t) => ({
      task: t.task || "Untitled Task",
      status: "pending",
      deadline: parseDate(t.deadline),
    }));

    // ✅ Save to DB
    const saved = await new Todo({
      email,
      summary,
      tasks: parsedTodos,
    }).save();

    // ✅ Send Email
    await sendSummaryEmail(email, summary);

    res.json({
      message: "✅ Extracted successfully",
      data: saved,
    });
  } catch (err) {
    console.log("❌ ERROR:", err.message);

    // ✅ FINAL FALLBACK RESPONSE
    res.status(200).json({
      message: "Fallback response (AI failed)",
      data: [],
    });
  }
};

// ✅ DATE PARSER
const parseDate = (date) => {
  if (!date) return null;
  return chrono.parseDate(date) || null;
};

// OTHER APIs
export const getAllTodos = async (req, res) => {
  const data = await Todo.find();
  res.json(data);
};

export const deleteAllTodos = async (req, res) => {
  await Todo.deleteMany({});
  res.json({ message: "Deleted" });
};

export const deleteTaskById = async (req, res) => {
  const { summaryId, taskId } = req.params;
  const updated = await Todo.findByIdAndUpdate(
    summaryId,
    { $pull: { tasks: { _id: taskId } } },
    { new: true }
  );
  res.json(updated);
};