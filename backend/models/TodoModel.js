import mongoose from "mongoose";

const TodoSchema = new mongoose.Schema(
  {
    //  Add user email (VERY IMPORTANT)
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    summary: { 
      type: String, 
      trim: true 
    },

    tasks: [
      {
        task: { 
          type: String, 
          required: [true, "Task description is required!"], 
          trim: true 
        },

        status: { 
          type: String, 
          enum: ["pending", "in-progress", "completed"], 
          lowercase: true,
          default: "pending" 
        },

        deadline: { 
          type: Date 
        },

        //  NEW FIELD (prevents duplicate emails)
        reminderSent: {
          type: Boolean,
          default: false,
        }
      }
    ]
  },
  { timestamps: true }
);

const Todo = mongoose.model("Todo", TodoSchema);
export default Todo;