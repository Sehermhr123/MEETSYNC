import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

const CalendarComponent = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/todos/get-todos");
        if (!response.ok) throw new Error("Failed to fetch todos");

        const data = await response.json();
        console.log("API Response:", data);

        // Extract tasks from each meeting entry
        const mappedEvents = data.flatMap(item => 
          (item.tasks || []).map(todo => {
            const eventDate = new Date(todo.deadline);

            if (isNaN(eventDate.getTime())) {
              console.warn("Invalid date found:", todo.deadline);
              return null; // Skip invalid dates
            }

            return {
              title: todo.task || "Untitled Task",
              start: eventDate.toISOString().split("T")[0], // Convert to YYYY-MM-DD
              end: eventDate.toISOString().split("T")[0],
              description: item.summary || "No description",
            };
          })
        ).filter(Boolean); // Remove null values

        console.log("Mapped Events:", mappedEvents);
        setEvents(mappedEvents);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, []);

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-center">Task Calendar</h2>

      {loading && <p className="text-center text-gray-600">Loading tasks...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      {!loading && events.length === 0 && <p className="text-center text-gray-500">No tasks available.</p>}

      <div className="mt-4">
        <FullCalendar plugins={[dayGridPlugin]} initialView="dayGridMonth" events={events} />
      </div>
    </div>
  );
};

export default CalendarComponent;
