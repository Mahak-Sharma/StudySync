import './GroupList.css';

const groups = [
  { id: 1, name: "Math Study Group" },
  { id: 2, name: "Physics Buddies" },
  { id: 3, name: "History Enthusiasts" },
];

const GroupList = () => (
  <div className="group-list-container">
    <h3 className="group-list-title">Available Groups</h3>
    <ul className="group-list-list">
      {groups.map(group => (
        <li className="group-list-item" key={group.id}>
          <span>{group.name}</span>
          <button className="group-list-join">Join</button>
        </li>
      ))}
    </ul>
    {/* Placeholder for future quiz status or quick access */}
  </div>
);

export default GroupList; 