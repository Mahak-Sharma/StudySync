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

export const PREMADE_ROOM_CODES = [
  'era-bxof-wzs',
  'tgi-xoei-ixz',
  'msx-kehx-nkr',
  'spi-lbgt-exl',
  'sgu-lssv-ulf',
  'zcg-unsk-six',
  'fyt-qnsi-tin',
  'tvo-pelt-yrn',
  'pxf-hcmw-xay',
  'cix-qxvr-ddc',
  'qlg-chaj-ljf',
  'ikv-hcou-rft',
  'dvl-ebnz-ujz',
  'yck-vbks-eje',
  'zma-uqap-uvs',
  'nuc-rsrm-viq',
  'xlt-zqoz-beu',
  'pzx-gfjy-ugk',
  'suj-huqf-gja',
  'xrn-mxxa-xbh',
  'ruj-equa-jse',
  'yyy-sesw-pxw',
  'odv-gpqr-kra',
  'nte-mydn-pgp',
  'azz-dwnc-nhz',
  'pcf-vens-pki',
  'xxm-rgun-qmx',
];

import { collection, getDocs } from 'firebase/firestore';

export const getUnusedRoomCode = async (db) => {
  // Get all groups and their roomCodes
  const groupsSnap = await getDocs(collection(db, "groups"));
  const usedRoomCodes = new Set();
  groupsSnap.forEach(doc => {
    const data = doc.data();
    if (data.roomCode) usedRoomCodes.add(data.roomCode);
  });
  // Find the first unused roomCode
  for (const code of PREMADE_ROOM_CODES) {
    if (!usedRoomCodes.has(code)) return code;
  }
  throw new Error('No unused room codes available');
};

// Quiz Feature API Calls
const QUIZ_API_BASE = 'https://studysync-quiz-backend.onrender.com';

export const createQuiz = async (groupId, quizData) => {
  const res = await fetch(`${QUIZ_API_BASE}/quiz/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...quizData, group_id: groupId }),
  });
  return await res.json();
};

export const fetchQuizzes = async (groupId) => {
  const res = await fetch(`${QUIZ_API_BASE}/quiz/list?group_id=${encodeURIComponent(groupId)}`);
  const data = await res.json();
  return data.quizzes || [];
};

export const startQuiz = async (quizId) => {
  const res = await fetch(`${QUIZ_API_BASE}/quiz/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quiz_id: quizId }),
  });
  return await res.json();
};

export const submitQuizAnswers = async (quizId, userId, answers) => {
  const res = await fetch(`${QUIZ_API_BASE}/quiz/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quiz_id: quizId, user_id: userId, answers }),
  });
  return await res.json();
};

export const fetchQuizLeaderboard = async (quizId) => {
  const res = await fetch(`${QUIZ_API_BASE}/quiz/leaderboard?quiz_id=${quizId}`);
  const data = await res.json();
  return data.leaderboard || [];
};

export const deleteQuiz = async (quizId) => {
  const res = await fetch(`${QUIZ_API_BASE}/quiz/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quiz_id: quizId }),
  });
  return await res.json();
}; 