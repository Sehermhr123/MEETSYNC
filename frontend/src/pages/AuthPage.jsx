import { useState } from "react";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = isLogin
      ? "http://localhost:5000/api/auth/login"
      : "http://localhost:5000/api/auth/register";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "/";
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">

      <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl 
        shadow-xl border border-white/20 w-[350px] text-white">

        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? "Login" : "Register"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {!isLogin && (
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              className="w-full p-2 rounded-lg bg-white/20 
              placeholder-gray-200 text-white outline-none focus:ring-2 focus:ring-purple-400"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            className="w-full p-2 rounded-lg bg-white/20 
            placeholder-gray-200 text-white outline-none focus:ring-2 focus:ring-purple-400"
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            className="w-full p-2 rounded-lg bg-white/20 
            placeholder-gray-200 text-white outline-none focus:ring-2 focus:ring-purple-400"
          />

          <button
            type="submit"
            className="w-full py-2 rounded-lg 
            bg-gradient-to-r from-blue-500 to-purple-500 
            hover:from-purple-500 hover:to-blue-500 
            transition-all duration-300 font-semibold"
          >
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
        </p>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-2 text-blue-200 hover:text-white transition"
        >
          Switch to {isLogin ? "Register" : "Login"}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;