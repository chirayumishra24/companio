import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { API_BASE, assetUrl, authHeaders, clearToken, getToken } from "../lib/config";
import { getSocket } from "../lib/socket";

function resolvePathParam(matchParam, contacts) {
  if (!matchParam) return "";
  const raw = decodeURIComponent(matchParam);
  const found = contacts.find(
    (contact) =>
      contact.email === raw ||
      String(contact.userId || "") === raw ||
      String(contact._id || "") === raw
  );
  return found?.email || "";
}

function formatStamp(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Messages() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const endRef = useRef(null);

  const [me, setMe] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const selectedContact = useMemo(
    () => contacts.find((item) => item.email === selectedEmail) || null,
    [contacts, selectedEmail]
  );

  const bounceToLogin = useCallback(() => {
    clearToken();
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    navigate(`/login?next=${next}`, { replace: true });
  }, [location.pathname, location.search, navigate]);

  const loadConversation = useCallback(
    async (peerEmail, silent = false) => {
      if (!peerEmail) {
        setMessages([]);
        return;
      }

      try {
        if (!silent) setLoadingChat(true);
        const { data } = await axios.get(`${API_BASE}/api/messages`, {
          params: { user2: peerEmail },
          headers: authHeaders(),
        });
        setMessages(Array.isArray(data) ? data : Array.isArray(data?.messages) ? data.messages : []);
      } catch (apiError) {
        if (apiError.response?.status === 401 || apiError.response?.status === 403) {
          bounceToLogin();
          return;
        }
        if (!silent) setError(apiError.response?.data?.message || "Could not load conversation.");
      } finally {
        if (!silent) setLoadingChat(false);
      }
    },
    [bounceToLogin]
  );

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      if (!getToken()) {
        bounceToLogin();
        return;
      }

      try {
        setLoadingContacts(true);
        setError("");

        const [meResp, contactsResp] = await Promise.all([
          axios.get(`${API_BASE}/api/me`, { headers: authHeaders() }),
          axios.get(`${API_BASE}/api/mutual-matches`, { headers: authHeaders() }),
        ]);

        if (!mounted) return;

        const list = Array.isArray(contactsResp.data) ? contactsResp.data : [];
        setMe(meResp.data || null);
        setContacts(list);
        setSelectedEmail((prev) => prev || list[0]?.email || "");
      } catch (apiError) {
        if (apiError.response?.status === 401 || apiError.response?.status === 403) {
          bounceToLogin();
          return;
        }
        if (mounted) setError(apiError.response?.data?.message || "Could not load conversations.");
      } finally {
        if (mounted) setLoadingContacts(false);
      }
    };

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [bounceToLogin]);

  useEffect(() => {
    if (!contacts.length) return;
    const fromParam = resolvePathParam(matchId, contacts);
    if (fromParam && fromParam !== selectedEmail) {
      setSelectedEmail(fromParam);
    }
  }, [contacts, matchId, selectedEmail]);

  useEffect(() => {
    if (!selectedEmail) return;
    loadConversation(selectedEmail, false);

    const socket = getSocket();
    if (socket) {
      const handleNewMessage = (newMsg) => {
        const isFromPeer = newMsg.sender?.toLowerCase() === selectedEmail.toLowerCase();
        const isToPeer = newMsg.receiver?.toLowerCase() === selectedEmail.toLowerCase();
        if (isFromPeer || isToPeer) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === newMsg._id)) return prev;
            return [...prev, newMsg];
          });
        }
      };

      socket.on("newMessage", handleNewMessage);
      return () => {
        socket.off("newMessage", handleNewMessage);
      };
    }
  }, [loadConversation, selectedEmail]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectContact = (email) => {
    if (!email) return;
    setSelectedEmail(email);
    setError("");
    navigate(`/messages/${encodeURIComponent(email)}`, { replace: true });
  };

  const clearSelection = () => {
    setSelectedEmail("");
    navigate("/messages", { replace: true });
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!selectedEmail) return;
    const text = draft.trim();
    if (!text || sending) return;

    try {
      setSending(true);
      const { data } = await axios.post(
        `${API_BASE}/api/messages/send`,
        { receiver: selectedEmail, content: text },
        { headers: authHeaders() }
      );
      setMessages((prev) => [...prev, data]);
      setDraft("");
      setError("");
    } catch (apiError) {
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        bounceToLogin();
        return;
      }
      setError(apiError.response?.data?.message || "Message send failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-brutal-bg p-2 md:p-8">
      <div className="max-w-6xl mx-auto h-[calc(100vh-120px)] min-h-[620px] border-8 border-black bg-white shadow-brutal-lg flex flex-col md:flex-row overflow-hidden">
        <aside className={`${selectedEmail ? "hidden md:flex" : "flex"} md:w-1/3 bg-brutal-yellow border-b-8 md:border-b-0 md:border-r-8 border-black flex-col`}>
          <div className="p-4 md:p-5 border-b-8 border-black bg-white">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Messages</h2>
            <p className="font-bold text-sm mt-1">{me?.email || "Loading account..."}</p>
          </div>

          {loadingContacts ? (
            <div className="p-5 font-black uppercase">Loading chats...</div>
          ) : contacts.length === 0 ? (
            <div className="p-5 space-y-3">
              <p className="font-bold">You have no mutual matches yet.</p>
              <button onClick={() => navigate("/matches")} className="neo-btn bg-brutal-cyan text-sm">
                Start Discovering
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {contacts.map((contact) => (
                <button
                  key={contact.email || contact.userId || contact._id}
                  type="button"
                  onClick={() => selectContact(contact.email)}
                  className={`w-full text-left p-4 border-b-4 border-black transition-colors ${selectedEmail === contact.email ? "bg-brutal-pink text-white" : "bg-brutal-yellow hover:bg-white"}`}
                >
                  <p className="font-black uppercase">{contact.name || "Traveler"}</p>
                  <p className="text-xs font-bold mt-1">
                    {contact.destination || "Open destination"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className={`${selectedEmail ? "flex" : "hidden md:flex"} md:w-2/3 flex-col bg-white`}>
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center p-6 bg-brutal-pink text-center">
              <h3 className="text-3xl md:text-4xl font-black uppercase text-white bg-black border-4 border-white p-4">
                Select a match to start planning your trip.
              </h3>
            </div>
          ) : (
            <>
              <header className="p-4 border-b-8 border-black bg-brutal-cyan flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button onClick={clearSelection} className="md:hidden neo-btn bg-white text-xs px-3 py-2">
                    Back
                  </button>
                  <img
                    src={assetUrl(selectedContact.image || "")}
                    alt={selectedContact.name || "Match"}
                    className="w-12 h-12 object-cover border-4 border-black bg-white"
                    onError={(event) => {
                      event.currentTarget.src = `${API_BASE}/static/images/default-avatar.png`;
                    }}
                  />
                  <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter">
                      {selectedContact.name || "Traveler"}
                    </h2>
                    <p className="font-bold text-xs">{selectedContact.destination || "Trip planning chat"}</p>
                  </div>
                </div>

                <button onClick={() => navigate("/matches")} className="neo-btn bg-white text-xs md:text-sm px-3 py-2">
                  Discover
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 bg-brutal-bg">
                {loadingChat ? (
                  <p className="font-black uppercase">Loading conversation...</p>
                ) : messages.length === 0 ? (
                  <p className="font-bold bg-white border-2 border-black p-3 inline-block">
                    Say hello and start coordinating your travel plans.
                  </p>
                ) : (
                  messages.map((message) => {
                    const mine = message.sender === me?.email;
                    return (
                      <article
                        key={message._id || `${message.sender}-${message.createdAt}`}
                        className={`max-w-[85%] border-4 border-black p-3 shadow-brutal-sm ${mine ? "ml-auto bg-brutal-green text-black" : "mr-auto bg-white"}`}
                      >
                        <p className="font-semibold whitespace-pre-wrap break-words">{message.content}</p>
                        <p className="text-[11px] font-black mt-1 uppercase">{formatStamp(message.createdAt)}</p>
                      </article>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t-8 border-black bg-white">
                {error ? (
                  <p className="bg-red-500 text-white font-bold p-2 border-2 border-black mb-3">{error}</p>
                ) : null}
                <div className="flex gap-2 md:gap-3">
                  <input
                    type="text"
                    className="neo-input flex-1"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Type a message..."
                    maxLength={1000}
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="neo-btn bg-brutal-pink text-white px-5"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
