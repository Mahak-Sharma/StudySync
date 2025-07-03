import './TodoBoard.css';
import React, { useState, useEffect } from "react";
import TodoItem from "./TodoItem";
import { db } from '../../api/firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const TodoBoard = ({ groupId }) => {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch todos from Firestore on mount
  useEffect(() => {
    const fetchTodos = async () => {
      setLoading(true);
      if (!groupId) return;
      const groupRef = doc(db, 'groups', groupId);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        const data = groupSnap.data();
        setTodos(data.todos || []);
      } else {
        setTodos([]);
      }
      setLoading(false);
    };
    fetchTodos();
  }, [groupId]);

  // Add a new todo to Firestore
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!input.trim() || !groupId) return;
    const newTodo = {
      id: Date.now().toString(),
      text: input,
      createdAt: new Date().toISOString(),
      status: 'pending',
      completedAt: null,
    };
    setTodos([...todos, newTodo]);
    setInput("");
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      todos: arrayUnion(newTodo)
    });
  };

  // Mark a todo as completed and update Firestore
  const handleComplete = async (id) => {
    const todoToComplete = todos.find(t => t.id === id);
    if (!todoToComplete) return;
    const updatedTodo = {
      ...todoToComplete,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };
    // Update UI
    setTodos(todos.map(todo => todo.id === id ? updatedTodo : todo));
    // Update Firestore: remove old, add updated
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      todos: arrayRemove(todoToComplete)
    });
    await updateDoc(groupRef, {
      todos: arrayUnion(updatedTodo)
    });
  };

  return (
    <div className="todo-board-container">
      <h3 className="todo-board-header">Todo List</h3>
      {loading ? <div>Loading...</div> : (
        <ul className="todo-board-list">
          {todos.filter(todo => todo.status === 'pending').map(todo => (
            <TodoItem
              key={todo.id}
              text={todo.text}
              onRemove={() => handleComplete(todo.id)}
            />
          ))}
        </ul>
      )}
      <form className="todo-board-form" onSubmit={handleAdd}>
        <input
          className="todo-board-input"
          type="text"
          placeholder="Add a new task..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button className="todo-board-add" type="submit">Add</button>
      </form>
    </div>
  );
};

export default TodoBoard; 