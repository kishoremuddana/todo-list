import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);

    try {

      const response = await axios.post(
        "http://127.0.0.1:8000/login",
        formData
      );

      const token = response.data.access_token;

      localStorage.setItem(
        "access_token",
        token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      toast.success("Login successful");

      navigate("/dashboard");

    } catch (error) {

      if (error.response) {

        toast.error(
          error.response.data.detail ||
          "Login failed"
        );

      } else {

        toast.error(
          "Unable to connect to server"
        );

      }

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="auth-page">

      <div className="auth-card">

        {/* LEFT SIDE */}

        <div className="auth-brand">

          <div className="brand-logo">
            TODO
          </div>

          <p className="brand-label">
            TASK WORKSPACE
          </p>

          <h1>
            Welcome back.
          </h1>

          <p className="brand-description">
            Sign in to continue managing
            your tasks and keep your
            work moving forward.
          </p>

        </div>


        {/* RIGHT SIDE */}

        <div className="auth-form-section">

          <div className="form-heading">

            <p className="form-eyebrow">
              ACCOUNT ACCESS
            </p>

            <h2>
              Login
            </h2>

            <p>
              Enter your details to
              access your workspace.
            </p>

          </div>


          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />

            </div>


            {/* PASSWORD */}

            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />

            </div>


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >

              {loading
                ? "Logging in..."
                : "Login"}

            </button>

          </form>


          {/* REGISTER */}

          <div className="auth-switch">

            <span>
              Don't have an account?
            </span>

            <button
              type="button"
              onClick={() =>
                navigate("/register")
              }
            >
              Create account
            </button>

          </div>

        </div>

      </div>

    </div>

  );
}

export default Login;