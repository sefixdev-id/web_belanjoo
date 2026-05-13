import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import { isFirebaseConfigured } from './firebaseClient.js';
import {
  formatChatTime,
  listenMessages,
  listenRooms,
  listenUsers,
  markRoomRead,
  openRoom,
  sendTextMessage,
  syncCurrentUser,
} from './chatService.js';

export default function ChatPanel({ user, notify }) {
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const unreadTotal = useMemo(
    () => rooms.reduce((sum, room) => sum + room.unreadFor(user?.id), 0),
    [rooms, user?.id],
  );

  useEffect(() => {
    if (!user || !isFirebaseConfigured) return undefined;
    syncCurrentUser(user).catch((error) => notify(error.message));
    const unsubRooms = listenRooms(user, setRooms, (error) => notify(error.message));
    const unsubUsers = listenUsers(user, setUsers, (error) => notify(error.message));
    return () => {
      unsubRooms();
      unsubUsers();
      syncCurrentUser(user, { isOnline: false }).catch(() => {});
    };
  }, [notify, user]);

  useEffect(() => {
    if (!activeRoom) {
      setMessages([]);
      return undefined;
    }
    markRoomRead({ roomId: activeRoom.id, user }).catch(() => {});
    return listenMessages(activeRoom.id, setMessages, (error) => notify(error.message));
  }, [activeRoom, notify, user]);

  const startRoom = async (targetUser) => {
    setBusy(true);
    try {
      setActiveRoom(await openRoom(user, targetUser));
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!activeRoom || !draft.trim()) return;
    const text = draft;
    setDraft('');
    try {
      await sendTextMessage({ roomId: activeRoom.id, sender: user, message: text });
    } catch (error) {
      notify(error.message);
      setDraft(text);
    }
  };

  if (!user) {
    return (
      <main className="page-shell">
        <EmptyState title="Login diperlukan" description="Masuk untuk membuka chat realtime BELANJOO." />
      </main>
    );
  }

  if (!isFirebaseConfigured) {
    return (
      <main className="page-shell">
        <EmptyState title="Chat belum dikonfigurasi" description="Isi VITE_FIREBASE_* di file .env website." />
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="chat-layout">
        <aside className="chat-sidebar panel">
          <div className="section__header">
            <div>
              <span className="eyebrow">Chat</span>
              <h2>Pesan realtime</h2>
              <p>{unreadTotal} pesan belum dibaca</p>
            </div>
          </div>

          <div className="chat-section-title">Percakapan</div>
          {rooms.length === 0 ? (
            <p>Belum ada percakapan.</p>
          ) : (
            rooms.map((room) => (
              <button className={`chat-room ${activeRoom?.id === room.id ? 'is-active' : ''}`} type="button" key={room.id} onClick={() => setActiveRoom(room)}>
                <strong>{room.otherName(user.id)}</strong>
                <span>{room.lastMessage || 'Mulai chat'}</span>
                {room.unreadFor(user.id) > 0 && <b>{room.unreadFor(user.id)}</b>}
              </button>
            ))
          )}

          <div className="chat-section-title">Kontak</div>
          {users.map((targetUser) => (
            <button className="chat-room" type="button" key={targetUser.id} disabled={busy} onClick={() => startRoom(targetUser)}>
              <strong>{targetUser.displayName}</strong>
              <span>{targetUser.role}</span>
            </button>
          ))}
        </aside>

        <section className="chat-window panel">
          {activeRoom ? (
            <>
              <div className="chat-window__header">
                <div>
                  <span className="eyebrow">Room</span>
                  <h2>{activeRoom.otherName(user.id)}</h2>
                </div>
              </div>
              <div className="message-list">
                {messages.length === 0 ? (
                  <EmptyState title="Belum ada pesan" description="Kirim pesan pertama untuk memulai percakapan." />
                ) : (
                  messages.map((message) => (
                    <div className={`message-bubble ${message.senderId === user.id ? 'is-me' : ''}`} key={message.id}>
                      <strong>{message.senderName}</strong>
                      <p>{message.message}</p>
                      <span>{formatChatTime(message.createdAt)}</span>
                    </div>
                  ))
                )}
              </div>
              <form className="chat-input" onSubmit={submit}>
                <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tulis pesan..." />
                <button className="button button--primary" type="submit">Kirim</button>
              </form>
            </>
          ) : (
            <EmptyState title="Pilih percakapan" description="Pilih kontak atau room untuk mulai chat." />
          )}
        </section>
      </section>
    </main>
  );
}
