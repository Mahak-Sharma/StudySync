// Placeholder for API calls

export const fetchGroups = async () => {
  // Simulate API call
  return [
    { id: 1, name: "Math Study Group" },
    { id: 2, name: "Physics Buddies" },
  ];
};

export const saveSummary = async (summary, userId, groupId, filename) => {
  const formData = new FormData();
  formData.append('file', new Blob([filename])); // Placeholder, not used for saving
  formData.append('user_id', userId);
  formData.append('group_id', groupId);
  formData.append('summary', summary);
  formData.append('filename', filename);
  // This is a placeholder; actual saving is done on summarize
};

export const fetchGroupSummaries = async (groupId) => {
  const res = await fetch(`http://localhost:5001/summaries?groupId=${groupId}`);
  const data = await res.json();
  return data.summaries;
};

export const fetchUserSummaries = async (userId) => {
  const res = await fetch(`http://localhost:5001/summaries?userId=${userId}`);
  const data = await res.json();
  return data.summaries;
};

// Friend Feature API Calls
export const searchUsers = async (query) => {
  const res = await fetch(`http://localhost:5000/user/search?query=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data.users;
};

export const sendFriendRequest = async (fromUserId, toUserId) => {
  const res = await fetch('http://localhost:5000/friend-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromUserId, toUserId })
  });
  return res.json();
};

export const getIncomingRequests = async (userId) => {
  const res = await fetch(`http://localhost:5000/friend-requests?userId=${userId}`);
  const data = await res.json();
  return data.requests;
};

export const respondToFriendRequest = async (requestId, accept) => {
  const res = await fetch('http://localhost:5000/friend-request/respond', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, accept })
  });
  return res.json();
};

export const getFriends = async (userId) => {
  const res = await fetch(`http://localhost:5000/friends?userId=${userId}`);
  const data = await res.json();
  return data.friends;
};

// Fetch group members
export const fetchGroupMembers = async (groupId) => {
  const res = await fetch(`http://localhost:5000/group-members?groupId=${groupId}`);
  const data = await res.json();
  return data.members;
};

// Send group invite
export const sendGroupInvite = async (friendId, groupId) => {
  const res = await fetch('http://localhost:5000/group-invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ friendId, groupId })
  });
  return res.json();
}; 