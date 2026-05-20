import { useState } from "react";
import { Loader2, Mic, ClipboardList, Calendar, Mail, FileText } from "lucide-react";

const TodoExtractor = ({ onExtract, onExtractEvents, onExtractEmails, onExtractSummary }) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [extractedData, setExtractedData] = useState({
    todos: [],
    events: [],
    emails: [],
    summary: "",
  });

  const handleExtract = async () => {
  if (!text.trim()) return;

  setLoading(true);
  setError("");

  try {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      setError("User not logged in");
      return;
    }

    const res = await fetch("http://localhost:5000/api/todos/extract-todos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paragraph: text,
        email: user.email, // 🔥 IMPORTANT
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Extraction failed");
    }

    const newTodos = data.todos || [];
    const newSummary = data.summary || "";

    setExtractedData((prev) => ({
      ...prev,
      todos: newTodos,
      summary: newSummary,
    }));

    if (onExtract) onExtract(newTodos);
    if (onExtractSummary) onExtractSummary(newSummary);

    alert("✅ Summary generated & email sent!");
  } catch (err) {
    setError(err.message);
    console.error("Extraction error:", err);
  } finally {
    setLoading(false);
  }
};

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
    setError("");
    setIsListening(true);

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalText = "";

    recognition.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + " ";
        } else {
          interimText = event.results[i][0].transcript;
        }
      }
      setText(finalText + interimText);
    };

    recognition.onerror = (event) => {
      setError("Speech recognition error: " + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="p-8 bg-white/20 shadow-xl rounded-2xl w-full max-w-xl mx-auto backdrop-blur-md border border-white/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/30 to-indigo-500/20 blur-xl"></div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-white mb-6 relative z-10 flex items-center gap-2">
        <ClipboardList className="w-6 h-6 text-white" /> Extract Meeting Data
      </h2>

      {/* Search Box */}
      <div className="relative w-full">
        <textarea
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 text-gray-900 bg-white/90 shadow-sm relative z-10"
          rows="4"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter or dictate meeting transcript..."
        />
        <button
          onClick={startListening}
          className={`absolute bottom-3 right-3 p-2 rounded-full transition-all ${
            isListening ? "bg-red-500" : "bg-teal-500"
          } text-white shadow-lg z-20`}
        >
          <Mic className="w-5 h-5" />
        </button>
      </div>

      {/* Extract Data Button */}
      <button
        onClick={handleExtract}
        className="mt-4 w-full flex items-center justify-center bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-600 hover:to-indigo-600 text-white font-semibold py-2 rounded-lg shadow-md transition-all disabled:opacity-50 relative z-10"
        disabled={loading}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Extract Data"}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/80 text-white rounded-lg relative z-10">
          <p className="font-semibold">⚠️ Error:</p>
          <p className="text-sm">{error}</p>
          {error.includes("quota") && (
            <p className="text-xs mt-2 opacity-90">
              💡 Tip: The free tier allows 20 requests per day. The quota resets daily.
            </p>
          )}
        </div>
      )}


      {/* Extracted Calendar Events */}
      {extractedData.events.length > 0 && (
        <div className="mt-6 relative z-10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Extracted Calendar Events
          </h3>
          <ul className="text-white text-sm space-y-1">
            {extractedData.events.map((event, index) => (
              <li key={index}>📅 {event.title} – {event.start}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Extracted Email Drafts */}
      {extractedData.emails.length > 0 && (
        <div className="mt-6 relative z-10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Mail className="w-5 h-5" /> Extracted Email Drafts
          </h3>
          <ul className="text-white text-sm space-y-1">
            {extractedData.emails.map((email, index) => (
              <li key={index}>✉️ To: {email.recipient} | Subject: {email.subject}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TodoExtractor;
