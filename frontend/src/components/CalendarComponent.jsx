import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

const CalendarComponent = ({ refreshTrigger }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "http://localhost:5000/api/todos/get-todos"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch todos");
        }

        const data = await response.json();

        console.log("📦 Calendar API Response:", data);

        const mappedEvents = data
          .flatMap((item) =>
            (item.tasks || []).map((task) => {
              if (!task.deadline) {
                console.warn(
                  "⚠️ Task has no deadline:",
                  task.task
                );
                return null;
              }

              const eventDate = new Date(task.deadline);

              if (isNaN(eventDate.getTime())) {
                console.warn(
                  "⚠️ Invalid deadline:",
                  task.deadline
                );
                return null;
              }

              // Use UTC values to prevent timezone date shifting
              const year = eventDate.getFullYear();

              const month = String(
                eventDate.getMonth() + 1
              ).padStart(2, "0");

              const day = String(
                eventDate.getDate()
              ).padStart(2, "0");

              const localDate = `${year}-${month}-${day}`;

              console.log(
                `📅 ${task.task} → ${localDate}`
              );

              return {
                id: task._id,
                title: task.task || "Untitled Task",
                start: localDate,
                allDay: true,
                description:
                  item.summary || "No description",
              };
            })
          )
          .filter(Boolean);

        console.log(
          "📅 Calendar Events:",
          mappedEvents
        );

        setEvents(mappedEvents);
      } catch (err) {
        console.error(
          "❌ Calendar fetch error:",
          err
        );
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, [refreshTrigger]);

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        Task Calendar
      </h2>

      {loading && (
        <p className="text-center text-gray-600">
          Loading tasks...
        </p>
      )}

      {error && (
        <p className="text-center text-red-500">
          {error}
        </p>
      )}

      {!loading && events.length === 0 && (
        <p className="text-center text-gray-500">
          No tasks available.
        </p>
      )}

      <div className="mt-4">
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={events}
          height="auto"
        />
      </div>
    </div>
  );
};

export default CalendarComponent;