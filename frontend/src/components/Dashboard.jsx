import "./Dashboard.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const API_URL = "https://todo-list-a3zn.onrender.com";

function Dashboard() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigned_user: "",
    status: "To Do",
    priority: "Medium",
    due_date: "",
    percentage: 0,
  });

  const [editTask, setEditTask] = useState({
    title: "",
    description: "",
    assigned_user: "",
    status: "To Do",
    priority: "Medium",
    due_date: "",
    percentage: 0,
  });

  // =========================
  // TOKEN
  // =========================

  const token = localStorage.getItem("access_token");

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // =========================
  // GET CURRENT USER
  // =========================

  const getCurrentUser = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/me`,
        authHeaders
      );

      setCurrentUser(response.data);
    } catch (error) {
      console.error(error);

      localStorage.removeItem("access_token");

      toast.error("Session expired");

      navigate("/login");
    }
  };

  // =========================
  // GET TASKS
  // =========================

  const getTasks = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/tasks`,
        authHeaders
      );

      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error(error);

      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
      } else {
        toast.error("Failed to load tasks");
      }
    }
  };

  // =========================
  // GET USERS
  // =========================

  const getUsers = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/users`,
        authHeaders
      );

      setUsers(
        response.data.users ||
          response.data ||
          []
      );
    } catch (error) {
      console.error(error);

      toast.error("Failed to load users");
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);

      await Promise.all([
        getCurrentUser(),
        getTasks(),
        getUsers(),
      ]);

      setLoading(false);
    };

    loadDashboard();
  }, []);

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("access_token");

    toast.success("Logged out successfully");

    navigate("/login");
  };

  // =========================
  // CREATE TASK
  // =========================

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!newTask.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    if (!newTask.assigned_user) {
      toast.error("Please select a user");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/tasks`,
        {
          title: newTask.title,
          description: newTask.description,
          assigned_user: newTask.assigned_user,
          status: newTask.status,
          priority: newTask.priority,
          due_date: newTask.due_date
            ? newTask.due_date
            : null,
          percentage: Number(
            newTask.percentage
          ),
        },
        authHeaders
      );

      toast.success(
        "Task created successfully"
      );

      setNewTask({
        title: "",
        description: "",
        assigned_user: "",
        status: "To Do",
        priority: "Medium",
        due_date: "",
        percentage: 0,
      });

      setShowCreate(false);

      await getTasks();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.detail ||
          "Failed to create task"
      );
    }
  };

  // =========================
  // PERMISSION CHECKS
  // =========================

  const isTaskCreator = (task) => {
    if (!currentUser || !task) {
      return false;
    }

    return (
      Number(task.created_by_id) === Number(currentUser.id) ||
      Number(task.created_by?.id) === Number(currentUser.id)
    );
  };

  const isAssignedUser = (task) => {
    if (!currentUser || !task) {
      return false;
    }

    return (
      Number(task.assigned_user_id) === Number(currentUser.id) ||
      Number(task.assigned_user?.id) === Number(currentUser.id)
    );
  };

  // =========================
  // STATUS UPDATE
  // ONLY ASSIGNED USER
  // =========================

  const updateStatus = async (
    task,
    newStatus
  ) => {
    if (!isAssignedUser(task)) {
      toast.error(
        "Only the assigned user can update the status"
      );
      return;
    }

    try {
      await axios.put(
        `${API_URL}/tasks/${task.id}`,
        {
          status: newStatus,
        },
        authHeaders
      );

      toast.success("Status updated");

      await getTasks();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.detail ||
          "Failed to update status"
      );
    }
  };

  // =========================
  // OPEN EDIT
  // ONLY CREATOR
  // =========================

  const openEdit = (task) => {
    if (!isTaskCreator(task)) {
      toast.error(
        "Only the task creator can edit this task"
      );
      return;
    }

    setSelectedTask(task);

    setEditTask({
      title: task.title || "",

      description:
        task.description || "",

      assigned_user:
        task.assigned_user?.email ||
        task.assigned_user ||
        "",

      status:
        task.status || "To Do",

      priority:
        task.priority || "Medium",

      due_date: task.due_date
        ? task.due_date.substring(0, 16)
        : "",

      percentage:
        task.percentage || 0,
    });

    setShowEdit(true);
  };

  // =========================
  // UPDATE TASK
  // ONLY CREATOR
  // =========================

  const handleEditTask = async (e) => {
    e.preventDefault();

    if (!selectedTask) {
      return;
    }

    if (!isTaskCreator(selectedTask)) {
      toast.error(
        "Only the task creator can edit this task"
      );
      return;
    }

    try {
      await axios.put(
        `${API_URL}/tasks/${selectedTask.id}`,
        {
          title: editTask.title,

          description:
            editTask.description,

          assigned_user:
            editTask.assigned_user,

          status:
            editTask.status,

          priority:
            editTask.priority,

          due_date:
            editTask.due_date
              ? editTask.due_date
              : null,

          percentage: Number(
            editTask.percentage
          ),
        },
        authHeaders
      );

      toast.success(
        "Task updated successfully"
      );

      setShowEdit(false);
      setSelectedTask(null);

      await getTasks();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.detail ||
          "Failed to update task"
      );
    }
  };

  // =========================
  // DELETE TASK
  // ONLY CREATOR
  // =========================

  const deleteTask = async (task) => {
    if (!isTaskCreator(task)) {
      toast.error(
        "Only the task creator can delete this task"
      );
      return;
    }

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this task?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/tasks/${task.id}`,
        authHeaders
      );

      toast.success(
        "Task deleted successfully"
      );

      await getTasks();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.detail ||
          "Failed to delete task"
      );
    }
  };

  // =========================
  // TASK COUNTS
  // =========================

  const totalTasks = tasks.length;

  const todoTasks = tasks.filter(
    (task) =>
      task.status === "To Do"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) =>
      task.status === "In Progress"
  ).length;

  const completedTasks = tasks.filter(
    (task) =>
      task.status === "Completed"
  ).length;

  // =========================
  // DATE FORMAT
  // =========================

  const formatDate = (date) => {
    if (!date) {
      return "No due date";
    }

    return new Date(
      date
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================
  // PRIORITY CLASS
  // =========================

  const getPriorityClass = (
    priority
  ) => {
    if (!priority) {
      return "";
    }

    return priority
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  // =========================
  // STATUS CLASS
  // =========================

  const getStatusClass = (status) => {
    if (!status) {
      return "";
    }

    return status
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="dashboard-loading">
        <h2>
          Loading dashboard...
        </h2>
      </div>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="dashboard-page">

      {/* ================= HEADER ================= */}

      <header className="dashboard-header">

        <div className="brand-section">
          <h1>TODO</h1>

          <p>
            Stay organized. Get things done.
          </p>
        </div>

        <div className="header-right">

          <div className="welcome-text">

            <span>
              Welcome back,
            </span>

            <strong>
              {currentUser?.name ||
                "User"}
            </strong>

          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </header>

      {/* ================= MAIN ================= */}

      <main className="dashboard-main">

        {/* ================= HERO ================= */}

        <section className="dashboard-hero">

          <div>

            <p className="hero-label">
              YOUR WORKSPACE
            </p>

            <h2>
              Good day,{" "}
              {currentUser?.name ||
                "User"}
            </h2>

            <p>
              Here's an overview of your
              tasks and progress.
            </p>

          </div>

          <button
            className="create-task-button"
            onClick={() =>
              setShowCreate(true)
            }
          >
            Create Task
          </button>

        </section>

        {/* ================= STATS ================= */}

        <section className="stats-grid">

          <div className="stat-card">
            <span>
              Total Tasks
            </span>

            <strong>
              {totalTasks}
            </strong>

            <p>
              All workspace tasks
            </p>
          </div>

          <div className="stat-card">
            <span>
              To Do
            </span>

            <strong>
              {todoTasks}
            </strong>

            <p>
              Waiting to start
            </p>
          </div>

          <div className="stat-card">
            <span>
              In Progress
            </span>

            <strong>
              {inProgressTasks}
            </strong>

            <p>
              Currently working
            </p>
          </div>

          <div className="stat-card">
            <span>
              Completed
            </span>

            <strong>
              {completedTasks}
            </strong>

            <p>
              Finished tasks
            </p>
          </div>

        </section>

        {/* ================= TASKS ================= */}

        <section className="tasks-section">

          <div className="tasks-heading">

            <div>

              <p className="section-label">
                WORKSPACE TASKS
              </p>

              <h2>
                All Tasks
              </h2>

            </div>

            <span>
              {tasks.length}{" "}
              {tasks.length === 1
                ? "task"
                : "tasks"}
            </span>

          </div>

          {/* NO SEARCH */}
          {/* NO STATUS FILTER */}
          {/* NO PRIORITY FILTER */}

          <div className="task-list">

            {tasks.length === 0 ? (

              <div className="empty-state">

                <h3>
                  No tasks yet
                </h3>

                <p>
                  Create your first task
                  to get started.
                </p>

                <button
                  className="create-task-button"
                  onClick={() =>
                    setShowCreate(true)
                  }
                >
                  Create Task
                </button>

              </div>

            ) : (

              tasks.map((task) => {

                const creator =
                  isTaskCreator(task);

                const assigned =
                  isAssignedUser(task);

                return (

                  <article
                    className="task-card"
                    key={task.id}
                  >

                    {/* ================= TASK TOP ================= */}

                    <div className="task-top">

                      <div className="task-title-area">

                        <div className="task-title-row">

                          <h3>
                            {task.title}
                          </h3>

                          <span
                            className={`priority-badge ${getPriorityClass(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>

                        </div>

                        <p className="task-description">
                          {task.description ||
                            "No description provided"}
                        </p>

                      </div>

                      <span
                        className={`status-badge ${getStatusClass(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </span>

                    </div>

                    {/* ================= TASK DETAILS ================= */}

                    <div className="task-details">

                      <div>

                        <span>
                          ASSIGNED TO
                        </span>

                        <strong>
                          {task.assigned_user
                            ?.name ||
                            task.assigned_user ||
                            "Unknown"}
                        </strong>

                      </div>

                      <div>

                        <span>
                          CREATED BY
                        </span>

                        <strong>
                          {task.created_by
                            ?.name ||
                            "Unknown"}
                        </strong>

                      </div>

                      <div>

                        <span>
                          DUE DATE
                        </span>

                        <strong>
                          {formatDate(
                            task.due_date
                          )}
                        </strong>

                      </div>

                    </div>

                    {/* ================= PROGRESS ================= */}

                    <div className="task-progress">

                      <div className="progress-heading">

                        <span>
                          Progress
                        </span>

                        <strong>
                          {task.percentage ||
                            0}
                          %
                        </strong>

                      </div>

                      <div className="progress-track">

                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(
                              Math.max(
                                task.percentage ||
                                  0,
                                0
                              ),
                              100
                            )}%`,
                          }}
                        />

                      </div>

                    </div>

                    {/* ================= ACTIONS ================= */}

                    <div className="task-actions">

                      {/* ASSIGNED USER */}
                      {/* CAN UPDATE STATUS */}

                      {assigned && (

                        <div className="status-control">

                          <label>
                            Update Status
                          </label>

                          <select
                            value={
                              task.status
                            }
                            onChange={(e) =>
                              updateStatus(
                                task,
                                e.target.value
                              )
                            }
                          >

                            <option value="To Do">
                              To Do
                            </option>

                            <option value="In Progress">
                              In Progress
                            </option>

                            <option value="Completed">
                              Completed
                            </option>

                          </select>

                        </div>

                      )}

                      {/* CREATOR */}
                      {/* CAN EDIT + DELETE */}

                      {creator && (

                        <div className="creator-actions">

                          <button
                            className="edit-button"
                            onClick={() =>
                              openEdit(task)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() =>
                              deleteTask(task)
                            }
                          >
                            Delete
                          </button>

                        </div>

                      )}

                    </div>

                  </article>

                );
              })

            )}

          </div>

        </section>

      </main>

      {/* ================= CREATE MODAL ================= */}

      {showCreate && (

        <div className="modal-overlay">

          <div className="task-modal">

            <div className="modal-header">

              <div>

                <p className="section-label">
                  NEW TASK
                </p>

                <h2>
                  Create Task
                </h2>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowCreate(false)
                }
              >
                Close
              </button>

            </div>

            <form
              onSubmit={handleCreateTask}
            >

              <div className="form-group">

                <label>
                  Task Title
                </label>

                <input
                  type="text"
                  placeholder="Enter task title"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      title:
                        e.target.value,
                    })
                  }
                />

              </div>

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  placeholder="Describe the task"
                  value={
                    newTask.description
                  }
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      description:
                        e.target.value,
                    })
                  }
                />

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Assign To
                  </label>

                  <select
                    value={
                      newTask.assigned_user
                    }
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        assigned_user:
                          e.target.value,
                      })
                    }
                  >

                    <option value="">
                      Select user
                    </option>

                    {users.map(
                      (user) => (

                        <option
                          key={user.id}
                          value={user.email}
                        >
                          {user.name} -{" "}
                          {user.email}
                        </option>

                      )
                    )}

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Priority
                  </label>

                  <select
                    value={
                      newTask.priority
                    }
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        priority:
                          e.target.value,
                      })
                    }
                  >

                    <option value="Low">
                      Low
                    </option>

                    <option value="Medium">
                      Medium
                    </option>

                    <option value="High">
                      High
                    </option>

                  </select>

                </div>

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Due Date
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      newTask.due_date
                    }
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        due_date:
                          e.target.value,
                      })
                    }
                  />

                </div>

                <div className="form-group">

                  <label>
                    Progress
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={
                      newTask.percentage
                    }
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        percentage:
                          e.target.value,
                      })
                    }
                  />

                </div>

              </div>

              <div className="modal-buttons">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    setShowCreate(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                >
                  Create Task
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ================= EDIT MODAL ================= */}

      {showEdit && (

        <div className="modal-overlay">

          <div className="task-modal">

            <div className="modal-header">

              <div>

                <p className="section-label">
                  EDIT TASK
                </p>

                <h2>
                  Update Task
                </h2>

              </div>

              <button
                className="close-button"
                onClick={() => {
                  setShowEdit(false);
                  setSelectedTask(null);
                }}
              >
                Close
              </button>

            </div>

            <form
              onSubmit={handleEditTask}
            >

              <div className="form-group">

                <label>
                  Task Title
                </label>

                <input
                  type="text"
                  value={
                    editTask.title
                  }
                  onChange={(e) =>
                    setEditTask({
                      ...editTask,
                      title:
                        e.target.value,
                    })
                  }
                />

              </div>

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  value={
                    editTask.description
                  }
                  onChange={(e) =>
                    setEditTask({
                      ...editTask,
                      description:
                        e.target.value,
                    })
                  }
                />

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Assign To
                  </label>

                  <select
                    value={
                      editTask.assigned_user
                    }
                    onChange={(e) =>
                      setEditTask({
                        ...editTask,
                        assigned_user:
                          e.target.value,
                      })
                    }
                  >

                    <option value="">
                      Select user
                    </option>

                    {users.map(
                      (user) => (

                        <option
                          key={user.id}
                          value={user.email}
                        >
                          {user.name} -{" "}
                          {user.email}
                        </option>

                      )
                    )}

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    value={
                      editTask.status
                    }
                    onChange={(e) =>
                      setEditTask({
                        ...editTask,
                        status:
                          e.target.value,
                      })
                    }
                  >

                    <option value="To Do">
                      To Do
                    </option>

                    <option value="In Progress">
                      In Progress
                    </option>

                    <option value="Completed">
                      Completed
                    </option>

                  </select>

                </div>

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Priority
                  </label>

                  <select
                    value={
                      editTask.priority
                    }
                    onChange={(e) =>
                      setEditTask({
                        ...editTask,
                        priority:
                          e.target.value,
                      })
                    }
                  >

                    <option value="Low">
                      Low
                    </option>

                    <option value="Medium">
                      Medium
                    </option>

                    <option value="High">
                      High
                    </option>

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Progress
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={
                      editTask.percentage
                    }
                    onChange={(e) =>
                      setEditTask({
                        ...editTask,
                        percentage:
                          e.target.value,
                      })
                    }
                  />

                </div>

              </div>

              <div className="form-group">

                <label>
                  Due Date
                </label>

                <input
                  type="datetime-local"
                  value={
                    editTask.due_date
                  }
                  onChange={(e) =>
                    setEditTask({
                      ...editTask,
                      due_date:
                        e.target.value,
                    })
                  }
                />

              </div>

              <div className="modal-buttons">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowEdit(false);
                    setSelectedTask(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                >
                  Save Changes
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Dashboard;