import {
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { chatCollections, getChatDb } from './firebaseClient.js';
import { isAdminRole } from '../api/apiClient.js';

const roleToText = (role) => String(role || 'user').trim() || 'user';

const timestampMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  return 0;
};

export const formatChatTime = (value) => {
  const millis = timestampMillis(value);
  if (!millis) return '';
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(millis));
};

const usernameFor = (user) => {
  if (user.email?.includes('@')) return user.email.split('@')[0].toLowerCase();
  return String(user.email || user.name || '').toLowerCase();
};

export const canChat = (currentUser, targetUser) => {
  if (!currentUser || !targetUser || currentUser.id === targetUser.id) return false;
  if (isAdminRole(currentUser.role)) return true;
  return isAdminRole(targetUser.role);
};

export const roomIdFor = (firstUserId, secondUserId) =>
  [firstUserId, secondUserId].sort().join('__');

const mapChatUser = (id, data = {}) => ({
  id: String(data.id || data.user_id || id || ''),
  name: String(data.name || data.nama || '').trim(),
  username: String(data.username || '').trim(),
  email: String(data.email || '').trim(),
  role: roleToText(data.role),
  isOnline: data.is_online === true,
  lastSeen: data.last_seen,
  photoUrl: String(data.photo_url || '').trim(),
  get displayName() {
    return this.name || this.email || this.username || 'User';
  },
});

const mapRoom = (id, data = {}) => ({
  id: String(data.id || id || ''),
  participants: Array.isArray(data.participants) ? data.participants.map(String) : [],
  participantNames: data.participant_names || {},
  participantRoles: data.participant_roles || {},
  lastMessage: String(data.last_message || ''),
  lastMessageAt: data.last_message_at,
  unreadCounts: data.unread_counts || {},
  unreadFor(userId) {
    return Number(this.unreadCounts?.[userId] || 0);
  },
  otherName(userId) {
    const otherId = this.participants.find((item) => item !== userId);
    return this.participantNames?.[otherId] || otherId || 'Chat';
  },
});

const mapMessage = (id, data = {}) => ({
  id: String(data.id || id || ''),
  senderId: String(data.sender_id || ''),
  senderName: String(data.sender_name || ''),
  senderRole: roleToText(data.sender_role),
  message: String(data.message || ''),
  type: String(data.type || 'text'),
  isRead: data.is_read === true,
  createdAt: data.created_at,
});

export function syncCurrentUser(user, { isOnline = true } = {}) {
  const db = getChatDb();
  if (!db || !user?.id) return Promise.resolve();
  const username = usernameFor(user);
  return setDoc(
    doc(db, chatCollections.users, user.id),
    {
      id: user.id,
      name: user.name,
      username,
      email: user.email,
      role: roleToText(user.role),
      is_online: isOnline,
      last_seen: serverTimestamp(),
      photo_url: '',
      updated_at: serverTimestamp(),
      created_at: serverTimestamp(),
      search_text: `${user.name} ${username} ${user.email}`.toLowerCase(),
    },
    { merge: true },
  );
}

export function listenRooms(user, callback, onError) {
  const db = getChatDb();
  if (!db || !user?.id) {
    callback([]);
    return () => {};
  }
  return onSnapshot(
    query(collection(db, chatCollections.rooms), where('participants', 'array-contains', user.id)),
    (snapshot) => {
      const rooms = snapshot.docs
        .map((item) => mapRoom(item.id, item.data()))
        .sort((a, b) => timestampMillis(b.lastMessageAt) - timestampMillis(a.lastMessageAt));
      callback(rooms);
    },
    onError,
  );
}

export function listenUsers(currentUser, callback, onError) {
  const db = getChatDb();
  if (!db || !currentUser?.id) {
    callback([]);
    return () => {};
  }
  return onSnapshot(
    collection(db, chatCollections.users),
    (snapshot) => {
      const users = snapshot.docs
        .map((item) => mapChatUser(item.id, item.data()))
        .filter((user) => canChat(currentUser, user))
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
      callback(users);
    },
    onError,
  );
}

export function listenMessages(roomId, callback, onError) {
  const db = getChatDb();
  if (!db || !roomId) {
    callback([]);
    return () => {};
  }
  return onSnapshot(
    query(
      collection(db, chatCollections.rooms, roomId, chatCollections.messages),
      orderBy('created_at'),
    ),
    (snapshot) => {
      callback(snapshot.docs.map((item) => mapMessage(item.id, item.data())));
    },
    onError,
  );
}

export async function openRoom(currentUser, targetUser) {
  const db = getChatDb();
  if (!db) throw new Error('Firebase chat belum dikonfigurasi.');
  if (!canChat(currentUser, targetUser)) throw new Error('Percakapan ini tidak diizinkan.');
  const roomId = roomIdFor(currentUser.id, targetUser.id);
  const roomRef = doc(db, chatCollections.rooms, roomId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (snapshot.exists()) {
      transaction.update(roomRef, { updated_at: serverTimestamp() });
      return;
    }
    transaction.set(roomRef, {
      id: roomId,
      participants: [currentUser.id, targetUser.id],
      participant_roles: {
        [currentUser.id]: roleToText(currentUser.role),
        [targetUser.id]: roleToText(targetUser.role),
      },
      participant_names: {
        [currentUser.id]: currentUser.name,
        [targetUser.id]: targetUser.displayName || targetUser.name || targetUser.email,
      },
      last_message: '',
      last_message_at: serverTimestamp(),
      unread_counts: { [currentUser.id]: 0, [targetUser.id]: 0 },
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  });

  const created = await getDoc(roomRef);
  return mapRoom(created.id, created.data());
}

export async function sendTextMessage({ roomId, sender, message }) {
  const db = getChatDb();
  const text = message.trim();
  if (!db || !text) return;

  const roomRef = doc(db, chatCollections.rooms, roomId);
  const messageRef = doc(collection(roomRef, chatCollections.messages));
  const room = await getDoc(roomRef);
  const participants = Array.isArray(room.data()?.participants) ? room.data().participants : [];
  const unreadUpdates = {};
  participants.forEach((participantId) => {
    if (participantId !== sender.id) {
      unreadUpdates[`unread_counts.${participantId}`] = increment(1);
    }
  });

  await runTransaction(db, async (transaction) => {
    transaction.set(messageRef, {
      id: messageRef.id,
      sender_id: sender.id,
      sender_name: sender.name,
      sender_role: roleToText(sender.role),
      message: text,
      type: 'text',
      is_read: false,
      read_by: [sender.id],
      created_at: serverTimestamp(),
    });
    transaction.update(roomRef, {
      last_message: text,
      last_message_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      ...unreadUpdates,
    });
  });
}

export function markRoomRead({ roomId, user }) {
  const db = getChatDb();
  if (!db || !roomId || !user?.id) return Promise.resolve();
  return updateDoc(doc(db, chatCollections.rooms, roomId), {
    [`unread_counts.${user.id}`]: 0,
    updated_at: serverTimestamp(),
  });
}
