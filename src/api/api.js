// API calls for StudySync

// Base URL for the main backend server
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://studysync-fgg4.onrender.com';

// Base URL for the friends backend server
const FRIENDS_BASE_URL = import.meta.env.VITE_FRIENDS_BACKEND_URL || 'https://studysync-friends-backend.onrender.com';

const SUMMARIZATION_BASE_URL = import.meta.env.VITE_SUMMARIZATION_BASE_URL || "http://localhost:5001";

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
  try {
    const res = await fetch(`${SUMMARIZATION_BASE_URL}/summaries?groupId=${groupId}`);
    if (!res.ok) throw new Error('Failed to fetch group summaries');
    const data = await res.json();
    return data.summaries;
  } catch (err) {
    console.error('Error in fetchGroupSummaries:', err);
    throw err;
  }
};

export const fetchUserSummaries = async (userId) => {
  try {
    const res = await fetch(`${SUMMARIZATION_BASE_URL}/summaries?userId=${userId}&personalOnly=true`);
    if (!res.ok) throw new Error('Failed to fetch user summaries');
    const data = await res.json();
    return data.summaries;
  } catch (err) {
    console.error('Error in fetchUserSummaries:', err);
    throw err;
  }
};

export const fetchPersonalSummaries = async (userId) => {
  try {
    const res = await fetch(`${SUMMARIZATION_BASE_URL}/summaries?userId=${userId}&personalOnly=true`);
    if (!res.ok) throw new Error('Failed to fetch personal summaries');
    const data = await res.json();
    return data.summaries;
  } catch (err) {
    console.error('Error in fetchPersonalSummaries:', err);
    throw err;
  }
};

export const deleteSummary = async (summaryId) => {
  try {
    const res = await fetch(`${SUMMARIZATION_BASE_URL}/summaries/${summaryId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete summary');
    return res.json();
  } catch (err) {
    console.error('Error in deleteSummary:', err);
    throw err;
  }
};

// Friend Feature API Calls
export const searchUsers = async (query) => {
  try {
    const res = await fetch(`${FRIENDS_BASE_URL}/user/search?query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to search users');
    const data = await res.json();
    return data.users;
  } catch (err) {
    console.error('Error in searchUsers:', err);
    throw err;
  }
};

export const sendFriendRequest = async (fromUserId, toUserId) => {
  try {
    const res = await fetch(`${FRIENDS_BASE_URL}/friend-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUserId, toUserId })
    });
    if (!res.ok) throw new Error('Failed to send friend request');
    return res.json();
  } catch (err) {
    console.error('Error in sendFriendRequest:', err);
    throw err;
  }
};

export const getIncomingRequests = async (userId) => {
  try {
    const res = await fetch(`${FRIENDS_BASE_URL}/friend-requests?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch incoming requests');
    const data = await res.json();
    return data.requests;
  } catch (err) {
    console.error('Error in getIncomingRequests:', err);
    throw err;
  }
};

export const respondToFriendRequest = async (requestId, accept) => {
  try {
    const res = await fetch(`${FRIENDS_BASE_URL}/friend-request/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, accept })
    });
    if (!res.ok) throw new Error('Failed to respond to friend request');
    return res.json();
  } catch (err) {
    console.error('Error in respondToFriendRequest:', err);
    throw err;
  }
};

export const getFriends = async (userId) => {
  try {
    const res = await fetch(`${FRIENDS_BASE_URL}/friends?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch friends');
    const data = await res.json();
    return data.friends;
  } catch (err) {
    console.error('Error in getFriends:', err);
    throw err;
  }
};

// Fetch group members
export const fetchGroupMembers = async (groupId) => {
  try {
    const res = await fetch(`${FRIENDS_BASE_URL}/group-members?groupId=${groupId}`);
    if (!res.ok) throw new Error('Failed to fetch group members');
    const data = await res.json();
    return data.members;
  } catch (err) {
    console.error('Error in fetchGroupMembers:', err);
    throw err;
  }
};

// Send group invite
export const sendGroupInvite = async (friendId, groupId) => {
  try {
    const res = await fetch(`${FRIENDS_BASE_URL}/group-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendId, groupId })
    });
    if (!res.ok) throw new Error('Failed to send group invite');
    return res.json();
  } catch (err) {
    console.error('Error in sendGroupInvite:', err);
    throw err;
  }
};

// 100ms Room Creation
export const create100msRoom = async (groupName) => {
  const BACKEND_URL = 'http://localhost:9000'; // Your backend server
  const res = await fetch(`${BACKEND_URL}/create-100ms-room-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupName })
  });
  if (!res.ok) throw new Error('Failed to create 100ms room');
  const data = await res.json();
  return data.code;
};

export const PREMADE_ROOM_IDS = [
  '68792d43a48ca61c46476010',
  '68792d16a48ca61c4647600f',
  '68792d09a48ca61c4647600e',
  '68792cf6a48ca61c4647600d',
  '68792ceaa5ba8326e6eb4897',
  '68792cdfa5ba8326e6eb4896',
  '68792cd1a5ba8326e6eb4895',
  '68792cc0a5ba8326e6eb4894',
  '68792caba48ca61c4647600c',
  '68792c7ba48ca61c4647600b',
  '68792c6ca48ca61c46476009',
  '68792c55a48ca61c46476008',
  '68792c2ea48ca61c46476006',
  '68778e51a5ba8326e6eb4748',
  '68790076576aae6c96ba5822',
  '687901cc252d7b52c5ff054a',
  '687902c8252d7b52c5ff06e4',
  '68790425576aae6c96ba5dab',
  '687906a9576aae6c96ba60c6',
  '68792c19a5ba8326e6eb488d',
  '68792c30a48ca61c46476007',
  '68792c56a5ba8326e6eb488e',
  '68792c66a5ba8326e6eb488f',
  '68792c73a48ca61c4647600a',
  '68792c80a5ba8326e6eb4890',
  '68792c8ca5ba8326e6eb4891',
  '68792c99a5ba8326e6eb4892',
  '68792ca5a5ba8326e6eb4893',
];

import { collection, getDocs } from 'firebase/firestore';

export const getUnusedRoomId = async (db) => {
  // Get all groups and their roomIds
  const groupsSnap = await getDocs(collection(db, "groups"));
  const usedRoomIds = new Set();
  groupsSnap.forEach(doc => {
    const data = doc.data();
    if (data.roomId) usedRoomIds.add(data.roomId);
  });
  // Find the first unused roomId
  for (const id of PREMADE_ROOM_IDS) {
    if (!usedRoomIds.has(id)) return id;
  }
  throw new Error('No unused room IDs available');
}; 