import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: ""
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

    // Check passwords
    if (
      formData.password !==
      formData.confirm_password
    ) {

      toast.error("Passwords do not match");

      return;
    }

    setLoading(true);

    try {

      const response = await axios.post(
        "http://127.0.0.1:8000/register",
        formData
      );

      toast.success(response.data.message);

      // Go to login after successful registration
      navigate("/login");

    } catch (error) {

      if (error.response) {

        toast.error(
          error.response.data.detail ||
          "Registration failed"
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

      <div className="auth-card register-card">

        {/* LEFT SIDE */}

        <div className="auth-brand register-brand">

          <div className="brand-logo">
            TODO
          </div>

          <p className="brand-label">
            TASK WORKSPACE
          </p>

          <h1>
            Start getting
            things done.
          </h1>

          <p className="brand-description">
            Create your account and
            organize your tasks in one
            simple workspace.
          </p>

        </div>


        {/* RIGHT SIDE */}

        <div className="auth-form-section">

          <div className="form-heading">

            <p className="form-eyebrow">
              CREATE ACCOUNT
            </p>

            <h2>
              Register
            </h2>

            <p>
              Create your account to
              get started with TUDO.
            </p>

          </div>


          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >

            {/* NAME */}

            <div className="form-group">

              <label htmlFor="name">
                Full Name
              </label>

              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />

            </div>


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
                placeholder="Create a password"
                required
              />

            </div>


            {/* CONFIRM PASSWORD */}

            <div className="form-group">

              <label htmlFor="confirm_password">
                Confirm Password
              </label>

              <input
                id="confirm_password"
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />

            </div>


            {/* REGISTER BUTTON */}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >

              {loading
                ? "Creating account..."
                : "Create Account"}

            </button>

          </form>


          {/* LOGIN */}

          <div className="auth-switch">

            <span>
              Already have an account?
            </span>

            <button
              type="button"
              onClick={() =>
                navigate("/login")
              }
            >
              Login
            </button>

          </div>

        </div>

      </div>

    </div>

  );
}

export default Register;