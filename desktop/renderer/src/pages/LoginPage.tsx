import { FormEvent, useState } from "react";

import type { CopyBundle } from "../i18n";
import type { AppLanguage, ThemeMode } from "../types/dto";

interface LoginPageProps {
  copy: CopyBundle;
  language: AppLanguage;
  themeMode: ThemeMode;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
  onLogin: (account: string) => void;
}

function SunIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4.5a1 1 0 0 1 1 1V7a1 1 0 1 1-2 0V5.5a1 1 0 0 1 1-1Zm0 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6.5-4a1 1 0 0 1 1 1 7.5 7.5 0 1 1-7.5-7.5 1 1 0 1 1 0 2 5.5 5.5 0 1 0 5.5 5.5 1 1 0 0 1 1-1ZM5.7 7.1a1 1 0 0 1 1.4 0l.8.8A1 1 0 0 1 6.5 9.3l-.8-.8a1 1 0 0 1 0-1.4Zm10.4 10.4a1 1 0 0 1 1.4 0l.8.8a1 1 0 0 1-1.4 1.4l-.8-.8a1 1 0 0 1 0-1.4ZM18.5 5.7a1 1 0 0 1 0 1.4l-.8.8a1 1 0 1 1-1.4-1.4l.8-.8a1 1 0 0 1 1.4 0ZM7.1 16.1a1 1 0 0 1 0 1.4l-.8.8a1 1 0 1 1-1.4-1.4l.8-.8a1 1 0 0 1 1.4 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MoonIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M13.6 3.5a1 1 0 0 1 .67 1.74A7.5 7.5 0 1 0 18.76 18a1 1 0 0 1 1.34 1.2A9.5 9.5 0 1 1 12.8 3.57a1 1 0 0 1 .8-.07Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LanguageIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 5h7v2H8.74c.46 1.02 1.04 2.02 1.75 2.97A14.5 14.5 0 0 0 12.31 7h2.07a16.9 16.9 0 0 1-2.66 4.84 14.1 14.1 0 0 0 2.39 2.36l-1.34 1.58a17.2 17.2 0 0 1-2.35-2.33A15.5 15.5 0 0 1 7 16.08L5.9 14.4a13.3 13.3 0 0 0 3.29-2.44A13.1 13.1 0 0 1 6.64 7H4V5Zm15.29 14-1.02-2.71h-4.54L12.71 19h-2.14l4.22-10.5h2.36L21.43 19h-2.14Zm-4.8-4.6h3l-1.5-4.02-1.5 4.02Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function LoginPage(props: LoginPageProps): JSX.Element {
  const { copy, language, themeMode, onToggleLanguage, onToggleTheme, onLogin } = props;
  const [account, setAccount] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const normalized = account.trim();
    if (!normalized || !password.trim()) {
      return;
    }
    onLogin(normalized);
  };

  return (
    <main className="login-shell">
      <section className="login-hero-card">
        <div className="login-hero-copy">
          <span className="topbar-eyebrow">PKB Assistant</span>
          <h1>{copy.loginTitle}</h1>
          <p className="login-subtitle">{copy.loginSubtitle}</p>
          <p className="login-welcome">{copy.loginWelcome}</p>
          <p className="login-footnote">{copy.loginFootnote}</p>
        </div>
        <div className="login-toolbar">
          <button className="icon-tool-btn" type="button" title={copy.toolbarTheme} aria-label={copy.toolbarTheme} onClick={onToggleTheme}>
            {themeMode === "light" ? <MoonIcon /> : <SunIcon />}
          </button>
          <button className="icon-tool-btn" type="button" title={copy.toolbarLanguage} aria-label={copy.toolbarLanguage} onClick={onToggleLanguage}>
            {language === "zh-CN" ? <span className="toolbar-text-badge">EN</span> : <LanguageIcon />}
          </button>
        </div>
      </section>

      <section className="login-form-card">
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            {copy.loginAccount}
            <input type="text" value={account} onChange={(event) => setAccount(event.target.value)} placeholder="demo@local" />
          </label>
          <label>
            {copy.loginPassword}
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="********" />
          </label>
          <p className="login-hint">{copy.loginHint}</p>
          <button className="primary-btn login-submit" type="submit" disabled={!account.trim() || !password.trim()}>
            {copy.loginSubmit}
          </button>
        </form>
      </section>
    </main>
  );
}