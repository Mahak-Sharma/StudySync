import './TodoBoard.css';
import React, { useState } from "react";

const initialTodos = [
  { id: 1, text: "Read Chapter 1" },
  { id: 2, text: "Complete Math Assignment" },
];

const TodoBoard = () => {
  const [todos, setTodos] = useState(initialTodos);
  const [input, setInput] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setTodos([...todos, { id: todos.length + 1, text: input }]);
      setInput("");
    }
  };

  return (
    <div className="todo-board-container">
      <h3 className="todo-board-header">Todo List</h3>
      <ul className="todo-board-list">
        {todos.map(todo => (
          <li className="todo-board-item" key={todo.id}>{todo.text}</li>
        ))}
      </ul>
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