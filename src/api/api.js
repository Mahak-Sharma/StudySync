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
  const res = await fetch(`http://localhost:5000/summaries?groupId=${groupId}`);
  const data = await res.json();
  return data.summaries;
};

export const fetchUserSummaries = async (userId) => {
  const res = await fetch(`http://localhost:5000/summaries?userId=${userId}`);
  const data = await res.json();
  return data.summaries;
}; 