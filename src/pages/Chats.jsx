import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { nhost } from '../nhost';
import './Chats.css';

const GET_USER_CHATS = gql`
  query GetUserChats($user_id: uuid!) {
    chatapp_chats(where: { user_id: { _eq: $user_id } }) {
      id
      title
      created_at
      messages(order_by: { created_at: asc }) {
        id
        content
        user_id
        created_at
      }
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation SendMessage($chat_id: uuid!, $user_id: uuid!, $content: String!) {
    insert_chatapp_messages_one(
      object: { chat_id: $chat_id, user_id: $user_id, content: $content }
    ) {
      id
      chat_id
      content
      user_id
      created_at
    }
  }
`;

const INSERT_BOT_REPLY = gql`
  mutation InsertBotReply($chat_id: uuid!, $user_id: uuid!, $content: String!) {
    insert_chatapp_messages_one(
      object: { chat_id: $chat_id, user_id: $user_id, content: $content }
    ) {
      id
      chat_id
      content
      user_id
      created_at
    }
  }
`;

const CREATE_CHAT = gql`
  mutation CreateChat($user_id: uuid!, $title: String!) {
    insert_chatapp_chats_one(object: { user_id: $user_id, title: $title }) {
      id
      title
      created_at
    }
  }
`;

const UPDATE_CHAT = gql`
  mutation UpdateChat($chat_id: uuid!, $title: String!) {
    update_chatapp_chats_by_pk(
      pk_columns: { id: $chat_id }
      _set: { title: $title }
    ) {
      id
      title
      created_at
    }
  }
`;

const DELETE_CHAT = gql`
  mutation DeleteChat($chat_id: uuid!) {
    delete_chatapp_messages(where: { chat_id: { _eq: $chat_id } }) {
      affected_rows
    }
    delete_chatapp_chats_by_pk(id: $chat_id) {
      id
    }
  }
`;

const Chats = () => {
  const user = nhost.auth.getUser();
  const handleLogout = async () => {
    await nhost.auth.signOut();
    window.location.href = '/';
  };
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [newChatTitle, setNewChatTitle] = useState('');
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const [isGettingAIReply, setIsGettingAIReply] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editChatTitle, setEditChatTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  console.log('Current user:', user); // Debug log

  const { data, loading, error, refetch } = useQuery(GET_USER_CHATS, {
    variables: { user_id: user?.id },
    skip: !user?.id,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  });

  const [sendMessage, { loading: sendingMessage }] = useMutation(SEND_MESSAGE, {
    onCompleted: (data) => {
      console.log('✅ Message sent successfully:', data);
      setMessage('');
      refetch();
    },
    onError: (error) => {
      console.error('Send message error:', error);
      alert('Error sending message: ' + error.message);
    },
  });

  const [insertBotReply] = useMutation(INSERT_BOT_REPLY, {
    onCompleted: () => {
      console.log('✅ Bot reply inserted successfully');
      setIsGettingAIReply(false);
      refetch();
    },
    onError: (error) => {
      console.error('❌ Insert bot reply error:', error);
      setIsGettingAIReply(false);
      alert('Error inserting bot reply: ' + error.message);
    },
  });

  const [createChat] = useMutation(CREATE_CHAT, {
    onCompleted: () => {
      setNewChatTitle('');
      setShowNewChatForm(false);
      refetch();
    },
    onError: (error) => {
      console.error('Create chat error:', error);
      alert('Error creating chat: ' + error.message);
    },
  });

  const [updateChat] = useMutation(UPDATE_CHAT, {
    onCompleted: () => {
      setEditingChatId(null);
      setEditChatTitle('');
      refetch();
    },
    onError: (error) => {
      console.error('Update chat error:', error);
      alert('Error updating chat: ' + error.message);
    },
  });

  const [deleteChat] = useMutation(DELETE_CHAT, {
    onCompleted: () => {
      setShowDeleteConfirm(null);
      setSelectedChat(null);
      refetch();
    },
    onError: (error) => {
      console.error('Delete chat error:', error);
      alert('Error deleting chat: ' + error.message);
    },
  });

  // Debug logs
  useEffect(() => {
    console.log('Query data:', data);
    console.log('Query loading:', loading);
    console.log('Query error:', error);

    // Check if OpenRouter API key is available
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    console.log('🔑 OpenRouter API Key available:', !!apiKey);
    console.log(
      '🔑 API Key value:',
      apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found'
    );

    if (!apiKey) {
      console.error(
        '❌ VITE_OPENROUTER_API_KEY is not set in environment variables'
      );
    }
  }, [data, loading, error]);

  if (!user) {
    return (
      <div className="chats-container">
        <div className="error-message">
          <p>Please log in to view your chats.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="chats-container">
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Loading chats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('GraphQL Error:', error);
    return (
      <div className="chats-container">
        <div className="error-message">
          <p>Error loading chats: {error.message}</p>
          <button onClick={() => refetch()} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const chats = data?.chatapp_chats || [];
  console.log('📋 Chats array:', chats); // Debug log

  const getAIReply = async (userMessage) => {
    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      console.log('🔑 Checking OpenRouter API Key:', !!apiKey);

      if (!apiKey) {
        console.error('❌ OpenRouter API key is not configured');
        return 'Sorry, OpenRouter API key is not configured.';
      }

      console.log('🤖 Making request to OpenRouter API...');

      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Chat App',
          },
          body: JSON.stringify({
            model: 'openai/gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful chatbot assistant.',
              },
              { role: 'user', content: userMessage },
            ],
            max_tokens: 150,
            temperature: 0.7,
          }),
        }
      );

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenRouter API error:', errorText);
        throw new Error(
          `OpenRouter API error: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log('✅ OpenRouter API response:', data);

      const aiReply =
        data.choices?.[0]?.message?.content ||
        "Sorry, I couldn't generate a response.";
      console.log('🤖 AI Reply:', aiReply);

      return aiReply;
    } catch (error) {
      console.error('❌ Error getting AI reply:', error);
      return `Sorry, I'm having trouble responding right now. Error: ${error.message}`;
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat || sendingMessage || isGettingAIReply)
      return;

    const userMessage = message.trim();
    console.log('📤 Sending user message:', userMessage);

    // Optimistically add the user's message to the selected chat
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      chat_id: selectedChat.id,
      content: userMessage,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };
    setSelectedChat((prev) => ({
      ...prev,
      messages: [...(prev.messages || []), optimisticMsg],
    }));
    setMessage('');

    try {
      // Send user message to backend
      await sendMessage({
        variables: {
          chat_id: selectedChat.id,
          user_id: user.id,
          content: userMessage,
        },
      });

      setIsGettingAIReply(true);
      // Get AI reply from OpenRouter
      const aiReply = await getAIReply(userMessage);
      // Optimistically add AI reply to chat
      const optimisticAI = {
        id: `ai-temp-${Date.now()}`,
        chat_id: selectedChat.id,
        content: aiReply,
        user_id: user.id, // Or use a bot id if you have one
        created_at: new Date().toISOString(),
      };
      setSelectedChat((prev) => ({
        ...prev,
        messages: [...(prev.messages || []), optimisticAI],
      }));
      // Insert bot reply into database
      await insertBotReply({
        variables: {
          chat_id: selectedChat.id,
          user_id: user.id, // Using logged-in user's ID for bot reply
          content: aiReply,
        },
      });
    } catch (error) {
      console.error('❌ Error in handleSend:', error);
      setIsGettingAIReply(false);
      alert(`Error: ${error.message}`);
    }
  };

  const handleCreateChat = async (e) => {
    e.preventDefault();
    if (!newChatTitle.trim()) return;

    try {
      await createChat({
        variables: {
          user_id: user.id,
          title: newChatTitle.trim(),
        },
      });
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleUpdateChat = async (e) => {
    e.preventDefault();
    if (!editChatTitle.trim()) return;

    try {
      await updateChat({
        variables: {
          chat_id: editingChatId,
          title: editChatTitle.trim(),
        },
      });
    } catch (error) {
      console.error('Error updating chat:', error);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await deleteChat({
        variables: {
          chat_id: chatId,
        },
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const startEditingChat = (chat) => {
    setEditingChatId(chat.id);
    setEditChatTitle(chat.title);
  };

  const cancelEditingChat = () => {
    setEditingChatId(null);
    setEditChatTitle('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="chats-container">
      {/* Sidebar */}
      <div className="chats-sidebar">
        <div className="sidebar-header">
          <h3>Your Chats</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowNewChatForm(!showNewChatForm)}
              className="new-chat-button"
            >
              + New Chat
            </button>
            <button
              onClick={handleLogout}
              className="logout-button"
              style={{
                background: '#e53e3e',
                color: 'white',
                borderRadius: '12px',
                padding: '10px 16px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {showNewChatForm && (
          <form onSubmit={handleCreateChat} className="new-chat-form">
            <input
              type="text"
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              placeholder="Enter chat title"
              className="new-chat-input"
              autoFocus
            />
            <div className="form-buttons">
              <button type="submit" className="create-button">
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowNewChatForm(false)}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="chats-list">
          {chats.length === 0 ? (
            <div className="no-chats">
              <p>No chats yet. Create your first chat!</p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${
                  selectedChat?.id === chat.id ? 'active' : ''
                }`}
              >
                {editingChatId === chat.id ? (
                  <form onSubmit={handleUpdateChat} className="edit-chat-form">
                    <input
                      type="text"
                      value={editChatTitle}
                      onChange={(e) => setEditChatTitle(e.target.value)}
                      className="edit-chat-input"
                      autoFocus
                    />
                    <div className="edit-chat-buttons">
                      <button
                        type="submit"
                        className="save-button"
                        title="Save"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditingChat}
                        className="cancel-edit-button"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div
                      className="chat-content"
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="chat-title">{chat.title}</div>
                      <div className="chat-preview">
                        {chat.messages?.length > 0
                          ? chat.messages[
                              chat.messages.length - 1
                            ].content.substring(0, 50) + '...'
                          : 'No messages yet'}
                      </div>
                    </div>
                    <div className="chat-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingChat(chat);
                        }}
                        className="edit-button"
                        title="Edit chat title"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(chat.id);
                        }}
                        className="delete-button"
                        title="Delete chat"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {selectedChat ? (
          <>
            <div className="chat-header">
              <h3>{selectedChat.title}</h3>
              <div className="chat-info">
                {selectedChat.messages?.length || 0} messages
              </div>
            </div>

            <div className="messages-container">
              {selectedChat.messages?.length === 0 ? (
                <div className="no-messages">
                  <p>No messages in this chat yet. Start the conversation!</p>
                </div>
              ) : (
                selectedChat.messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message ${
                      msg.user_id === user.id ? 'user-message' : 'bot-message'
                    }`}
                  >
                    <div className="message-content">{msg.content}</div>
                    <div className="message-info">
                      {msg.user_id === user.id ? 'You' : 'Bot'} •{' '}
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
              {isGettingAIReply && (
                <div className="message bot-message">
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                  <div className="message-info">Bot • typing...</div>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="message-form">
              <div className="message-input-container">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="message-input"
                  rows="1"
                />
                <button
                  type="submit"
                  disabled={
                    !message.trim() || sendingMessage || isGettingAIReply
                  }
                  className="send-button"
                >
                  {sendingMessage
                    ? 'Sending...'
                    : isGettingAIReply
                    ? 'AI thinking...'
                    : 'Send'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="welcome-message">
              <h3>Welcome to your chats!</h3>
              <p>
                Select a chat from the sidebar to start messaging, or create a
                new chat.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete Chat</h3>
            <p>
              Are you sure you want to delete this chat? This action cannot be
              undone and will delete all messages in this chat.
            </p>
            <div className="modal-buttons">
              <button
                onClick={() => handleDeleteChat(showDeleteConfirm)}
                className="delete-confirm-button"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chats;
