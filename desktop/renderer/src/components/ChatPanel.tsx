import { FormEvent } from "react";

import type { CopyBundle } from "../i18n";
import type { Message } from "../types/dto";

interface ChatPanelProps {
  messages: Message[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => Promise<void>;
  sending: boolean;
  copy: CopyBundle;
}

export default function ChatPanel(props: ChatPanelProps): JSX.Element {
  const { messages, inputValue, onInputChange, onSend, sending, copy } = props;

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void onSend();
  };

  return (
    <section className="panel panel-center">
      <div className="panel-head panel-head-android">
        <h2>{copy.chatTitle}</h2>
      </div>
      <div className="chat-list chat-list-android">
        {messages.length === 0 ? (
          <div className="chat-empty">{copy.chatEmpty}</div>
        ) : (
          messages.map((message) => (
            <article key={message.id} className={`chat-row ${message.role}`}>
              <div className={`chat-bubble ${message.role}`}>
                <p>{message.content}</p>
              </div>
            </article>
          ))
        )}
      </div>
      <form className="chat-input-row chat-input-row-android" onSubmit={handleSubmit}>
        <div className="chat-compose">
          <input
            type="text"
            value={inputValue}
            placeholder={copy.chatPlaceholder}
            onChange={(event) => onInputChange(event.target.value)}
            disabled={sending}
          />
          <button type="submit" disabled={sending || !inputValue.trim()}>
            {sending ? copy.sending : copy.send}
          </button>
        </div>
      </form>
    </section>
  );
}
