import { GoogleGenerativeAI } from "@google/generative-ai";
import Todo from "../models/TodoModel.js";
import dotenv from "dotenv";
import * as chrono from "chrono-node";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// ======================================================
// SAFE AI FUNCTION WITH RETRY
// ======================================================

const safeAI = async (prompt) => {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-3.6-flash",
      });

      const result = await model.generateContent(prompt);

      const responseText = result.response.text();

      console.log(
        `🤖 AI RESPONSE (Attempt ${attempt}):`,
        responseText
      );

      return responseText;
    } catch (err) {
      console.log(
        `❌ AI attempt ${attempt}/${maxRetries} failed:`,
        err.message
      );

      // Quota exhausted — do NOT retry
      if (
        err.status === 429 ||
        err.message.includes("429") ||
        err.message.toLowerCase().includes("quota")
      ) {
        console.log(
          "⚠️ Gemini quota exhausted → skipping retries"
        );

        return null;
      }

      // Retry temporary errors
      if (attempt < maxRetries) {
        console.log("🔄 Retrying AI request...");

        await new Promise((resolve) => {
          setTimeout(resolve, 2000);
        });
      }
    }
  }

  console.log(
    "❌ AI failed after all retries → using fallback"
  );

  return null;
};

// ======================================================
// MAIN EXTRACT FUNCTION
// ======================================================

export const extractTodosAndSummary = async (req, res) => {
  try {
    const { paragraph, email } = req.body;

    if (!paragraph || !email) {
      return res.status(400).json({
        message: "Missing data",
      });
    }

    console.log("🔥 API HIT");

    // ==================================================
    // AI TASK EXTRACTION
    // ==================================================

    const aiTodos = await safeAI(`
Extract ALL actionable tasks from the meeting transcript below.

Return ONLY a valid JSON array.
Do not use markdown.
Do not use code fences.
Do not add explanations.

Each object MUST contain exactly:
"task"
"assigned_to"
"due_date"

VERY IMPORTANT DATE RULES:

1. Extract every actionable task separately.
2. Extract the deadline belonging to each task.
3. If the transcript says "today", return exactly:
   "today"
4. If the transcript says "tomorrow", return exactly:
   "tomorrow"
5. If the transcript gives a specific date such as:
   "September 22"
   "22 September"
   "September 25th"
   "25/09/2026"
   preserve that exact date meaning.
6. NEVER change a mentioned date.
7. NEVER invent a deadline.
8. If a task has no deadline, use null.
9. If different tasks have different deadlines, return separate objects.
10. Do not merge multiple tasks into one object.

Example format:

[
  {
    "task": "Finish the website testing",
    "assigned_to": "Priya",
    "due_date": "tomorrow"
  },
  {
    "task": "Prepare the presentation",
    "assigned_to": "Rahul",
    "due_date": "September 24"
  }
]

Meeting transcript:
${paragraph}
`);

    // ==================================================
    // AI SUMMARY
    // ==================================================

    const aiSummary = await safeAI(`
Summarize the following meeting transcript clearly and concisely.

Mention:
- important discussion points
- assigned tasks
- responsible people
- deadlines

Do not invent any information.

Meeting transcript:
${paragraph}
`);

    let todos = [];
    let summary = "No summary available.";

    // ==================================================
    // PARSE AI TASK RESPONSE
    // ==================================================

    if (aiTodos) {
      try {
        const cleanedAIResponse = aiTodos
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();

        const parsed = JSON.parse(cleanedAIResponse);

        if (Array.isArray(parsed)) {
          todos = parsed;

          console.log(
            "✅ AI tasks parsed successfully:",
            todos.length
          );
        }
      } catch (err) {
        console.log(
          "⚠️ Failed to parse AI tasks:",
          err.message
        );
      }
    }

    // ==================================================
    // SAVE SUMMARY
    // ==================================================

    if (aiSummary) {
      summary = aiSummary
        .replace(/```/g, "")
        .trim();
    }

    // ==================================================
    // FALLBACK TASK
    // ==================================================

    if (todos.length === 0) {
      console.log("⚠️ Using fallback task");

      todos = [
        {
          task: paragraph.slice(0, 80),
          assigned_to: "",
          due_date: "tomorrow",
        },
      ];
    }

    // ==================================================
    // PARSE TASKS + DEADLINES
    // ==================================================

    const parsedTodos = todos.map((t) => {
      const dateText = t.due_date || t.deadline || null;

      const parsedDeadline = parseDate(dateText);

      console.log("📌 Task:", t.task);
      console.log("📅 Original deadline:", dateText);
      console.log(
        "📅 Parsed deadline:",
        parsedDeadline
      );

      return {
        task: t.task || "Untitled Task",
        status: "pending",
        deadline: parsedDeadline,
      };
    });

    // ==================================================
    // SAVE TO MONGODB
    // ==================================================

    const saved = await new Todo({
      email,
      summary,
      tasks: parsedTodos,
    }).save();

    console.log("✅ Todo saved successfully");
    console.log(
      "📊 Saved tasks:",
      saved.tasks.length
    );

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      message: "Extracted successfully",
      data: saved,
    });
  } catch (err) {
    console.log("❌ ERROR:", err.message);

    return res.status(200).json({
      message: "Fallback response",
      data: [],
    });
  }
};

// ======================================================
// DATE PARSER
// ======================================================

const parseDate = (dateText) => {
  if (!dateText) {
    return null;
  }

  try {
    const normalizedText = String(dateText)
      .trim()
      .replace(/^by\s+/i, "")
      .replace(/^before\s+/i, "")
      .trim();

    // --------------------------------------------------
    // Get today's date in India
    // --------------------------------------------------

    const indiaParts = new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(new Date());

    const currentYear = Number(
      indiaParts.find(
        (part) => part.type === "year"
      ).value
    );

    const currentMonth = Number(
      indiaParts.find(
        (part) => part.type === "month"
      ).value
    );

    const currentDay = Number(
      indiaParts.find(
        (part) => part.type === "day"
      ).value
    );

    // --------------------------------------------------
    // TODAY
    // --------------------------------------------------

    if (/^today$/i.test(normalizedText)) {
      const result = new Date(
        Date.UTC(
          currentYear,
          currentMonth - 1,
          currentDay,
          12,
          0,
          0
        )
      );

      console.log(
        "📅 TODAY parsed as:",
        result.toISOString()
      );

      return result;
    }

    // --------------------------------------------------
    // TOMORROW
    // --------------------------------------------------

    if (/^tomorrow$/i.test(normalizedText)) {
      const result = new Date(
        Date.UTC(
          currentYear,
          currentMonth - 1,
          currentDay + 1,
          12,
          0,
          0
        )
      );

      console.log(
        "📅 TOMORROW parsed as:",
        result.toISOString()
      );

      return result;
    }

    // --------------------------------------------------
    // EXPLICIT DATE
    // --------------------------------------------------

    /*
      Important:
      Use India's current date as the reference date
      for chrono-node so relative dates are interpreted
      from the correct day.
    */

    const referenceDate = new Date(
      currentYear,
      currentMonth - 1,
      currentDay,
      12,
      0,
      0
    );

    const parsed = chrono.parseDate(
      normalizedText,
      referenceDate,
      {
        forwardDate: true,
      }
    );

    if (!parsed) {
      console.log(
        "⚠️ Could not parse deadline:",
        dateText
      );

      return null;
    }

    /*
      Store date-only values at UTC noon.

      Example:
      September 24
      ->
      2026-09-24T12:00:00.000Z

      This prevents the calendar date from shifting
      because of timezone conversion.
    */

    const result = new Date(
      Date.UTC(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate(),
        12,
        0,
        0
      )
    );

    console.log(
      `📅 "${dateText}" → ${result.toISOString()}`
    );

    return result;
  } catch (err) {
    console.log(
      "⚠️ Date parsing error:",
      err.message
    );

    return null;
  }
};

// ======================================================
// GET ALL TODOS
// ======================================================

export const getAllTodos = async (req, res) => {
  try {
    const data = await Todo.find();

    console.log(
      "📊 Total Todo Documents:",
      data.length
    );

    res.json(data);
  } catch (err) {
    console.log(
      "❌ Error fetching todos:",
      err.message
    );

    res.status(500).json({
      message: "Failed to fetch todos",
    });
  }
};

// ======================================================
// DELETE ALL TODOS
// ======================================================

export const deleteAllTodos = async (req, res) => {
  try {
    await Todo.deleteMany({});

    console.log("🗑️ All todos deleted");

    res.json({
      message: "Deleted",
    });
  } catch (err) {
    console.log(
      "❌ Error deleting todos:",
      err.message
    );

    res.status(500).json({
      message: "Failed to delete todos",
    });
  }
};

// ======================================================
// DELETE SINGLE TASK
// ======================================================

export const deleteTaskById = async (req, res) => {
  try {
    const { summaryId, taskId } = req.params;

    const updated = await Todo.findByIdAndUpdate(
      summaryId,
      {
        $pull: {
          tasks: {
            _id: taskId,
          },
        },
      },
      {
        new: true,
      }
    );

    res.json(updated);
  } catch (err) {
    console.log(
      "❌ Error deleting task:",
      err.message
    );

    res.status(500).json({
      message: "Failed to delete task",
    });
  }
};