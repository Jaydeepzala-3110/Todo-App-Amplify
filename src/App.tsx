import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import './index.css';
import './App.css';

const client = generateClient<Schema>();

type TodoType = Schema["Todo"]["type"];

export default function App() {
  const [todos, setTodos] = useState<TodoType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ title: "", description: "" });

  useEffect(() => {
    loadTodos();
    const sub = client.models.Todo.observeQuery().subscribe({
      next: ({ items }) => setTodos(items),
      error: console.error,
    });
    return () => sub.unsubscribe();
  }, []);

  async function loadTodos() {
    try {
      const { data } = await client.models.Todo.list();
      setTodos(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function createTodo() {
    if (!addForm.title.trim()) return;
    setIsLoading(true);
    try {
      await client.models.Todo.create({
        title: addForm.title.trim(),
        description: addForm.description.trim() || undefined,
      });
      closeAddModal();
      await loadTodos();
    } catch {
      alert("Failed to create todo.");
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteTodo(id: string) {
    if (!confirm("Delete this task?")) return;
    setIsLoading(true);
    try {
      await client.models.Todo.delete({ id });
      await loadTodos();
    } catch {
      alert("Delete failed.");
    } finally {
      setIsLoading(false);
    }
  }

  function startEdit(todo: TodoType) {
    setEditingId(todo.id);
    setEditForm({ title: todo.title || "", description: todo.description || "" });
  }

  async function saveEdit(id: string) {
    if (!editForm.title.trim()) return;
    setIsLoading(true);
    try {
      await client.models.Todo.update({
        id,
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
      });
      cancelEdit();
      await loadTodos();
    } catch {
      alert("Update failed.");
    } finally {
      setIsLoading(false);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ title: "", description: "" });
  }

  function openAddModal() {
    setAddForm({ title: "", description: "" });
    setShowAddModal(true);
  }
  function closeAddModal() {
    setShowAddModal(false);
    setAddForm({ title: "", description: "" });
  }

  return (
    <div className="app-container">
      <div className="main-content">
        <header className="header">
          <h1 className="header-title">My Todo List</h1>
          <p className="header-subtitle">Stay organized and productive</p>
          <div className="header-badge">{todos.length} Tasks</div>
        </header>

        <div className="p-6 text-right">
          <button
            onClick={openAddModal}
            disabled={isLoading}
            className="btn btn-primary"
          >
            <Plus size={18} /> Add Task
          </button>
        </div>

        <div className="p-6">
          {todos.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-7xl">📝</span>
              <h2 className="text-2xl font-semibold mb-2">No tasks yet</h2>
              <p>Add your first task to get started!</p>
            </div>
          ) : (
            todos.map((todo) => (
              <div key={todo.id} className="todo-card mb-4">
                {editingId === todo.id ? (
                  <div className="modal-body">
                    <label>Title</label>
                    <input
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, title: e.target.value }))
                      }
                    />
                    <label>Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                    <div className="modal-footer">
                      <button
                        onClick={() => saveEdit(todo.id)}
                        className="btn btn-success"
                        disabled={isLoading}
                      >
                        <Save size={16} /> Save
                      </button>
                      <button onClick={cancelEdit} className="btn btn-cancel">
                        <X size={16} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="todo-content">
                    <div className="todo-info">
                      <h3 className="todo-title">{todo.title}</h3>
                      {todo.description && (
                        <p className="todo-desc">{todo.description}</p>
                      )}
                      <div className="todo-meta">
                        <span>
                          <strong>Created:</strong>{" "}
                          {new Date(todo.createdAt || "").toLocaleString()}
                        </span>
                        <span style={{ marginLeft: 12 }}>
                          <strong>Updated:</strong>{" "}
                          {new Date(todo.updatedAt || "").toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="todo-actions">
                      <button
                        onClick={() => startEdit(todo)}
                        className="action-btn"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="action-btn"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {showAddModal && (
          <div className="modal-backdrop">
            <div className="modal">
              <div className="modal-header">
                <h2 className="modal-title">Add New Task</h2>
                <button onClick={closeAddModal} className="action-btn">
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <label>
                  Title <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  value={addForm.title}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, title: e.target.value }))
                  }
                />
                <label>Description</label>
                <textarea
                  value={addForm.description}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                />
              </div>
              <div className="modal-footer">
                <button onClick={closeAddModal} className="btn btn-cancel">
                  Cancel
                </button>

                <div 
                  className="add-btn-container"
                >
                <button
                  onClick={createTodo}
                  className="btn btn-primary"
                  disabled={!addForm.title.trim() || isLoading}
                >
                  <Plus size={16} /> Add Task
                </button>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
