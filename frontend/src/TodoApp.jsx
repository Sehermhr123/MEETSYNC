import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [paragraph, setParagraph] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/todos/get-todos");
      setTodos(res.data || []);
    } catch (error) {
      console.error("Error fetching todos:", error);
      toast.error("Failed to load todos!");
    }
  };

  const extractTodos = async () => {
    if (!paragraph.trim()) {
      toast.warn("Please enter a meeting transcript!");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/todos/extract-todos",
        { paragraph }
      );
      setTodos(response.data.todos || []);
      setSummary(response.data.summary || "");
      toast.success("Todos extracted successfully!");
    } catch (error) {
      console.error("Error extracting todos:", error);
      toast.error("Failed to extract todos!");
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.start();
    recognition.onresult = (event) => {
      setParagraph(event.results[0][0].transcript);
    };
  };

  const updateTodoStatus = async (todoId, status) => {
    if (!todoId) {
      console.error("🚨 Error: todoId is undefined!");
      toast.error("Invalid todo item!");
      return;
    }
  
    try {
      console.log(`Updating todo with ID: ${todoId}, status: ${status}`); // Debugging
  
      await axios.put(`http://localhost:5000/api/todos/update-todo/${todoId}`, { status });
  
      toast.success("✅ Todo updated!");
      fetchTodos();
    } catch (error) {
      console.error("❌ Error updating todo:", error);
      toast.error("Failed to update todo!");
    }
  };
  

  const deleteAllTodos = async () => {
    try {
      await axios.delete("http://localhost:5000/api/todos/delete-todos");
      toast.success("All todos deleted!");
      setTodos([]);
    } catch (error) {
      console.error("Error deleting todos:", error);
      toast.error("Failed to delete todos!");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Meeting Todo Extractor</h1>
      <textarea
        className="w-full p-2 border rounded"
        rows="4"
        placeholder="Enter meeting transcript..."
        value={paragraph}
        onChange={(e) => setParagraph(e.target.value)}
      />
      <div className="flex space-x-2 mt-2">
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={startListening}>
          🎤 Start Recording
        </button>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={extractTodos} disabled={loading}>
          {loading ? "Processing..." : "Extract Todos"}
        </button>
      </div>
      {summary && (
        <div className="mt-4 p-2 border rounded bg-gray-100">
          <h2 className="font-bold">Summary:</h2>
          <p>{summary}</p>
        </div>
      )}
      <h1 className="text-2xl font-bold mt-6 mb-4">📝 Todos</h1>
      <button
        onClick={deleteAllTodos}
        className="mb-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        ❌ Delete All Todos
      </button>
      {todos.length === 0 ? (
        <p>No todos found. Add some by processing a meeting conversation.</p>
      ) : (
        todos.map((todo) => (
          <div key={todo._id} className="bg-gray-100 p-4 mb-4 rounded shadow">
            <h2 className="text-lg font-semibold">📌 {todo.task}</h2>
            <p className="text-sm text-gray-600">Deadline: {todo.deadline}</p>
            <button
              onClick={() => updateTodoStatus(todo._id, "completed")}
              className={`mt-2 px-4 py-2 text-white rounded ${
                todo.status === "completed" ? "bg-gray-500" : "bg-green-500 hover:bg-green-700"
              }`}
              disabled={todo.status === "completed"}
            >
              {todo.status === "completed" ? "✅ Completed" : "✔ Mark Complete"}
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default TodoApp;