import { useEffect, useState } from "react";
import TodoExtractor from "../components/TodoExtractor";
import TodoList from "../components/TodoList";
import { fetchTodos } from "../services/api";
import CalendarComponent from "../components/CalendarComponent";

const Home = () => {
  const [todos, setTodos] = useState([]);
  const [summary, setSummary] = useState("");
  const [calendarRefresh, setCalendarRefresh] = useState(0);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const data = await fetchTodos();
      setTodos(data);
    } catch (error) {
      console.error(
        "Error fetching todos:",
        error
      );
    }
  };

  const handleExtract = async () => {
    // Fetch newly saved data from backend
    await loadTodos();

    // Tell calendar to fetch fresh data
    setCalendarRefresh(
      (prev) => prev + 1
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 to-indigo-700 flex flex-col items-center p-6">
      {/* Main Card */}
      <div className="w-full max-w-3xl bg-white/40 backdrop-blur-xl shadow-2xl rounded-2xl p-8 transition-all hover:shadow-indigo-500/50">

        {/* Title */}
        <h1 className="text-3xl font-extrabold text-white text-center mb-6">
          🚀 Meeting Todo Manager
        </h1>

        {/* Todo Extraction Component */}
        <TodoExtractor
          onExtract={handleExtract}
          onExtractSummary={setSummary}
        />

        {/* Todo List Component */}
        <div className="mt-8">
          <TodoList
            todos={todos}
            setTodos={setTodos}
            newSummary={summary}
          />
        </div>

        {/* Calendar Component */}
        <div className="mt-10">
          <CalendarComponent
            refreshTrigger={calendarRefresh}
          />
        </div>

      </div>
    </div>
  );
};

export default Home;