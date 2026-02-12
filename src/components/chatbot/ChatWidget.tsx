import { useState, useRef, useEffect } from 'react';
import { findAnswer } from './knowledge';
import './ChatWidget.css';

interface Message {
  content: string;
  isUser: boolean;
}

interface ChatWidgetProps {
  locale?: string;
  recentPosts?: { title: string; href: string; date: string }[];
}

const quickReplies = ['DevOps', 'Kubernetes', 'Projets', 'Contact', 'CV'];

const labels = {
  fr: {
    title: 'Assistant Virtuel',
    subtitle: 'Posez vos questions',
    placeholder: 'Tapez votre question...',
    welcome:
      'Bonjour ! 👋 Je suis là pour vous aider à en savoir plus sur mes compétences et mes projets. Posez-moi une question ou cliquez sur un sujet ci-dessous.',
    noAnswer:
      "Désolé, je n'ai pas trouvé d'information sur ce sujet. Voici quelques exemples de questions :<br><br>💻 <strong>Technologies :</strong> DevOps, Kubernetes, Docker, Ansible, Terraform, Python, Bash, Proxmox...<br><br>👤 <strong>À propos :</strong> Qui êtes-vous ? Vos projets ? Votre blog ? Votre CV ?<br><br>📞 <strong>Contact :</strong> Comment vous contacter ?",
    recentArticles: '📝 Articles Récents',
    viewAll: 'Voir tous les articles →',
  },
  en: {
    title: 'Virtual Assistant',
    subtitle: 'Ask me anything',
    placeholder: 'Type your question...',
    welcome:
      "Hello! 👋 I'm here to help you learn more about my skills and projects. Ask me a question or click a topic below.",
    noAnswer:
      "Sorry, I couldn't find information on that topic. Here are some example questions:<br><br>💻 <strong>Technologies:</strong> DevOps, Kubernetes, Docker, Ansible, Terraform, Python, Bash, Proxmox...<br><br>👤 <strong>About:</strong> Who are you? Your projects? Your blog? Your CV?<br><br>📞 <strong>Contact:</strong> How to contact you?",
    recentArticles: '📝 Recent Articles',
    viewAll: 'View all articles →',
  },
};

export default function ChatWidget({ locale = 'fr', recentPosts = [] }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesRef = useRef<HTMLDivElement>(null);

  const l = labels[locale as keyof typeof labels] || labels.fr;

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSend(question?: string) {
    const q = (question || input).trim();
    if (!q) return;

    const userMsg: Message = { content: q, isUser: true };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const answer = findAnswer(q);
      const botMsg: Message = {
        content: answer || l.noAnswer,
        isUser: false,
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 500);
  }

  return (
    <>
      {/* Floating button */}
      <button
        className="chat-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
        )}
      </button>

      {/* Chat container */}
      {isOpen && (
        <div className="chat-container">
          <div className="chat-header">
            <div>
              <h3>{l.title}</h3>
              <p>{l.subtitle}</p>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)} aria-label={locale === 'fr' ? 'Fermer le chat' : 'Close chat'}>
              &times;
            </button>
          </div>

          <div className="chat-messages" ref={messagesRef}>
            {/* Welcome message */}
            <div className="message bot">
              <div
                className="message-content"
                dangerouslySetInnerHTML={{ __html: l.welcome }}
              />
            </div>

            {/* Recent articles */}
            {recentPosts.length > 0 && (
              <div className="message bot">
                <div className="message-content" style={{ maxWidth: '90%' }}>
                  <strong>{l.recentArticles}</strong>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0' }}>
                    {recentPosts.slice(0, 5).map((post, i) => (
                      <li
                        key={i}
                        style={{
                          marginBottom: '8px',
                          paddingBottom: '8px',
                          borderBottom: '1px solid var(--color-border, #e0e0e0)',
                        }}
                      >
                        <a
                          href={post.href}
                          style={{
                            color: 'var(--color-accent, #3b5998)',
                            fontWeight: 500,
                            textDecoration: 'none',
                            fontSize: '13px',
                          }}
                        >
                          {post.title}
                        </a>
                        <br />
                        <span style={{ fontSize: '11px', opacity: 0.7 }}>{post.date}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`/${locale}/posts/`}
                    style={{
                      color: 'var(--color-accent, #3b5998)',
                      fontWeight: 600,
                      fontSize: '13px',
                      textDecoration: 'none',
                    }}
                  >
                    {l.viewAll}
                  </a>
                </div>
              </div>
            )}

            {/* Dynamic messages */}
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.isUser ? 'user' : 'bot'}`}>
                <div
                  className="message-content"
                  dangerouslySetInnerHTML={{ __html: msg.content }}
                />
              </div>
            ))}
          </div>

          <div className="quick-replies">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                className="quick-reply-btn"
                onClick={() => handleSend(reply)}
              >
                {reply}
              </button>
            ))}
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              className="chat-input"
              placeholder={l.placeholder}
              aria-label={locale === 'fr' ? 'Votre message' : 'Your message'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="send-btn" onClick={() => handleSend()} aria-label={locale === 'fr' ? 'Envoyer' : 'Send'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
