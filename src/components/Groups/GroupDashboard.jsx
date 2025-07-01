import './GroupDashboard.css';

const members = ["Alice", "Bob", "Charlie"];

const GroupDashboard = ({ groupName = "Math Study Group" }) => (
  <div className="group-dashboard-container">
    <h3 className="group-dashboard-title">{groupName}</h3>
    <div className="group-dashboard-header">Members</div>
    <ul className="group-dashboard-list">
      {members.map((member, idx) => (
        <li className="group-dashboard-member" key={idx}>{member}</li>
      ))}
    </ul>
    <div className="group-dashboard-actions">
      <button className="group-dashboard-leave">Leave Group</button>
    </div>
  </div>
);

export default GroupDashboard; 