import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" });

  async function loadTasks() {
    setError("");
    try {
      const response = await fetch(`${API}/api/tasks`);
      if (!response.ok) throw new Error("Could not load tasks. Is the API running?");
      setTasks(await response.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTasks(); }, []);

  async function createTask(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    try {
      const response = await fetch(`${API}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!response.ok) throw new Error("Task creation failed.");
      setForm({ title: "", description: "", priority: "medium" });
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateStatus(task) {
    const next = task.status === "todo" ? "in_progress" : task.status === "in_progress" ? "done" : "todo";
    const response = await fetch(`${API}/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next })
    });
    if (response.ok) loadTasks();
    else setError("Could not update task status.");
  }

  async function deleteTask(id) {
    const response = await fetch(`${API}/api/tasks/${id}`, { method: "DELETE" });
    if (response.ok) loadTasks();
    else setError("Could not delete task.");
  }

  const visibleTasks = useMemo(
    () => filter === "all" ? tasks : tasks.filter(task => task.status === filter),
    [tasks, filter]
  );
  const completed = tasks.filter(task => task.status === "done").length;
  const active = tasks.filter(task => task.status === "in_progress").length;

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark">T</span> TaskFlow</a>
        <span className="workspace">TEAM WORKSPACE <b>●</b></span>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>Make progress, <span>together.</span></h1>
          <p className="subtext">A clear view of your team's work, priorities and next steps.</p>
        </div>
        <div className="date-chip">✦ &nbsp; Focus on what matters</div>
      </section>

      <section className="stats">
        <article className="stat-card"><span>Total tasks</span><strong>{tasks.length}</strong><small>Across your workspace</small></article>
        <article className="stat-card"><span>In progress</span><strong>{active}</strong><small>Currently being worked on</small></article>
        <article className="stat-card"><span>Completed</span><strong>{completed}</strong><small>Successfully finished</small></article>
      </section>

      <section className="content-grid">
        <div className="panel task-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">PROJECT OVERVIEW</p><h2>Your tasks</h2></div>
            <select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter tasks">
              <option value="all">All tasks</option>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Completed</option>
            </select>
          </div>
          {error && <div className="error">{error}</div>}
          {loading ? <p className="empty">Loading your workspace…</p> :
            visibleTasks.length === 0 ? <p className="empty">No tasks here yet. Add your first task using the form.</p> :
            <div className="task-list">
              {visibleTasks.map(task => (
                <article className="task-row" key={task.id}>
                  <button className={`status-dot ${task.status}`} onClick={() => updateStatus(task)} title="Advance task status" />
                  <div className="task-info">
                    <strong>{task.title}</strong>
                    <p>{task.description || "No description added."}</p>
                    <div className="badges">
                      <span className={`badge ${task.status}`}>{task.status.replace("_", " ")}</span>
                      <span className={`badge ${task.priority}`}>{task.priority} priority</span>
                    </div>
                  </div>
                  <button className="delete" onClick={() => deleteTask(task.id)} aria-label={`Delete ${task.title}`}>×</button>
                </article>
              ))}
            </div>
          }
        </div>

        <aside className="panel create-panel">
          <p className="eyebrow">QUICK ACTION</p>
          <h2>Create a task</h2>
          <p className="form-hint">Capture the next thing that needs to get done.</p>
          <form onSubmit={createTask}>
            <label>Task title<input required maxLength="160" placeholder="e.g. Prepare project brief" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></label>
            <label>Description<textarea rows="4" placeholder="Add a few helpful details…" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></label>
            <label>Priority<select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
            <button className="primary" type="submit">＋ Add task</button>
          </form>
        </aside>
      </section>
      <footer>TaskFlow <span>Built for focused teamwork.</span></footer>
    </main>
  );
}

export default App;
