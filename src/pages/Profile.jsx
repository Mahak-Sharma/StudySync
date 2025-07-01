import './Profile.css';

const user = {
  name: "Alice Smith",
  email: "alice@example.com",
  avatar: "https://i.pravatar.cc/150?img=1",
  groups: ["Math Study Group", "Physics Buddies"]
};

const Profile = () => (
  <div className="profile-container">
    <div className="profile-card">
      <img className="profile-avatar" src={user.avatar} alt={user.name} />
      <h2 className="profile-name">{user.name}</h2>
      <div className="profile-email">{user.email}</div>
      <div className="profile-groups-section">
        <h3 className="profile-groups-title">Joined Groups</h3>
        <ul className="profile-groups-list">
          {user.groups.map((group, idx) => (
            <li className="profile-groups-item" key={idx}>{group}</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export default Profile; 