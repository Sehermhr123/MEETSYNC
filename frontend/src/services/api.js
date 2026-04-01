import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/todos"; // Update this to match your backend

// Fetch all todos
export const fetchTodos = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/get-todos`);
    return response.data;
  } catch (error) {
    console.error("Error fetching todos:", error);
    return [];
  }
};

// Extract todos and summary from text
export const extractTodos = async (paragraph) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/extract-todos`, { paragraph });
    return response.data;
  } catch (error) {
    console.error("Error extracting todos:", error);
    
    // Handle quota exceeded error
    if (error.response?.status === 429) {
      throw new Error(error.response.data?.message || "API quota exceeded. You've reached the daily limit (20 requests/day). Please try again tomorrow.");
    }
    
    // Handle other errors
    if (error.response?.data?.error) {
      throw new Error(error.response.data.message || error.response.data.error);
    }
    
    throw new Error(error.message || "Failed to extract todos. Please try again.");
  }
};

// Delete all todos
export const deleteAllTodos = async () => {
  try {
    await axios.delete(`${API_BASE_URL}/delete-todos`);
    console.log("All todos deleted successfully");
  } catch (error) {
    console.error("Error deleting all todos:", error);
  }
};

export const deleteTodo = async (summaryId, taskId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/delete/${summaryId}/tasks/${taskId}`);
    console.log(`Task ${taskId} deleted successfully:`, response.data);
  } catch (error) {
    console.error(`Error deleting task ${taskId}:`, error.response?.data || error.message);
  }
};