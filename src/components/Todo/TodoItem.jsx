import './TodoItem.css';

const TodoItem = ({ text, checked, onCheck }) => (
  <li className="todo-item-container">
    <input
      className="todo-item-checkbox"
      type="checkbox"
      checked={checked}
      onChange={onCheck}
    />
    <span className={checked ? "todo-item-checked" : ""}>{text}</span>
  </li>
);

export default TodoItem; 