import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: [true, "Event title is required!"], 
      trim: true 
    },
    start: { 
      type: Date, 
      required: [true, "Event start date is required!"] 
    },
    end: { 
      type: Date // Optional end date
    },
    description: { 
      type: String, 
      trim: true 
    },
    location: { 
      type: String, 
      trim: true 
    }
  },
  { timestamps: true } // Adds createdAt & updatedAt
);

const Event = mongoose.model("Event", EventSchema);
export default Event;
