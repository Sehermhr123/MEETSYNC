import cron from "node-cron";
import nodemailer from "nodemailer";
import Todo from "../models/TodoModel.js";
import dotenv from "dotenv";

dotenv.config();

// ✅ Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Send Reminder Email
const sendReminderEmail = async (task, email) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "⏰ Task Reminder",
      text: `Reminder: Your task "${task.task}" is due tomorrow (${task.deadline})`,
    });

    console.log(`📧 Reminder sent to ${email} for task: ${task.task}`);
    return true;
  } catch (error) {
    console.error("❌ Reminder email failed:", error.message);
    return false;
  }
};

// ✅ Helper: Compare ONLY date (ignore time)
const isSameDate = (d1, d2) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

// ✅ Schedule Reminder
export const scheduleReminders = () => {
  cron.schedule("* * * * *", async () => {
    console.log("🔍 Checking reminders...");

    try {
      const todos = await Todo.find();
      console.log("📊 Total Todos:", todos.length);

      // 👉 tomorrow date (no time confusion)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      for (const todo of todos) {
        for (const task of todo.tasks) {
          if (!task.deadline || task.reminderSent) continue;

          const taskDate = new Date(task.deadline);

          console.log("Task:", task.task);
          console.log("Deadline:", taskDate.toDateString());

          if (isSameDate(taskDate, tomorrow)) {
            console.log("🔥 MATCH FOUND:", task.task);

            const sent = await sendReminderEmail(task, todo.email);

            if (sent) {
              task.reminderSent = true;
            }
          }
        }

        await todo.save();
      }

      console.log("✅ Reminder check completed");
    } catch (error) {
      console.error("❌ Reminder error:", error.message);
    }
  });

  console.log("⏰ Reminder service started");
};