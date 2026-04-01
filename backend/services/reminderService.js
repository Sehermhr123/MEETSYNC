import cron from "node-cron";
import nodemailer from "nodemailer";
import Todo from "../models/TodoModel.js";
import dotenv from "dotenv";

dotenv.config();

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,  // Your email
    pass: process.env.EMAIL_PASS,  // App password
  },
});

// Function to Send Reminder Emails
const sendReminderEmail = async (task, recipient) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipient,
    subject: `🔔 Task Reminder: ${task.task}`,
    text: `Reminder! Your task "${task.task}" is due tomorrow. Deadline: ${new Date(task.deadline).toLocaleDateString()}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Reminder sent for task: ${task.task}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};

// Function to Schedule Daily Reminder Check
export const scheduleReminders = () => {
  cron.schedule("0 9 * * *", async () => { // Runs every day at 9 AM
    console.log("🔍 Checking for upcoming task deadlines...");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const todos = await Todo.find({
      "tasks.deadline": { $gte: tomorrow, $lte: tomorrowEnd },
    });

    for (const todo of todos) {
      for (const task of todo.tasks) {
        if (task.deadline) {
          const taskDeadline = new Date(task.deadline);
          if (taskDeadline >= tomorrow && taskDeadline <= tomorrowEnd) {
            await sendReminderEmail(task, process.env.RECIPIENT_EMAIL);
          }
        }
      }
    }
  });

  console.log("⏰ Reminder service scheduled (Runs every day at 9 AM)");
};
