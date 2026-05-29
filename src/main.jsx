import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import backgroundUrl from "./assets/background.jpg";
import wavesUrl from "./assets/waves.svg";
import logoUrl from "./assets/logo.svg";

const FORM_COPY = {
  login: {
    title: "Bem-vindo",
    description: "Faça o login para acessar o sistema.",
    fields: [
      { label: "E-mail", name: "email", type: "email", autoComplete: "email" },
      { label: "Senha", name: "password", type: "password", autoComplete: "current-password" },
    ],
    submit: "Entrar",
    link: "Esqueceu sua senha?",
  },
  recovery: {
    title: "Esqueci a minha senha",
    description: "Digite o e-mail da sua conta e enviaremos um link para você criar uma nova senha.",
    fields: [{ label: "E-mail", name: "recoveryEmail", type: "email", autoComplete: "email" }],
    submit: "Solicitar link de recuperação",
    link: "Volte para página de login",
  },
  resetPassword: {
    title: "Crie uma nova senha",
    description: "Sua nova senha precisa ter no mínimo 8 caracteres.",
    fields: [
      { label: "Nova senha", name: "newPassword", type: "password", autoComplete: "new-password" },
      { label: "Confirmar nova senha", name: "confirmPassword", type: "password", autoComplete: "new-password" },
    ],
    submit: "Salvar nova senha",
  },
};

const NOTICE_COPY = {
  blocked: {
    title: "Conta bloqueada",
    description:
      "Sua conta foi bloqueada por segurança após várias tentativas. Entre em contato com o administrador para liberá-la.",
  },
};

const INTERNAL_DEMO_COPY = {
  title: "Sistema interno Faarkey",
  description: "Esta é uma página demonstrativa criada apenas para simular o acesso ao ambiente interno do sistema.",
};

const RECOVERY_SENT_COPY = {
  title: "Verifique seu e-mail",
  description: "Se houver uma conta associada, enviamos um link para você criar uma nova senha.",
  action: "Reenviar link",
  loginLink: "Volte para página de login",
  resendFeedback: "Link reenviado. Verifique sua caixa de entrada.",
};

const HASH_TO_VIEW = {
  "#recuperar-senha": "recovery",
  "#verifique-email": "recoverySent",
  "#criar-nova-senha": "resetPassword",
  "#conta-bloqueada": "blocked",
  "#sistema-demo": "internalDemo",
};

const VIEW_TO_HASH = {
  login: "#login",
  recovery: "#recuperar-senha",
  recoverySent: "#verifique-email",
  resetPassword: "#criar-nova-senha",
  blocked: "#conta-bloqueada",
  internalDemo: "#sistema-demo",
};

const DEMO_CREDENTIALS = {
  email: "demo@faarkey.com",
  password: "faarkey2026",
};

const ERROR_COPY = {
  wrongCredentials: "E-mail ou senha incorretos. Verifique e tente novamente.",
  emptyEmail: "Digite seu e-mail.",
  emptyPassword: "Digite sua senha.",
  invalidEmail: "Digite um e-mail válido.",
  passwordTooShort: "A senha precisa ter no mínimo 8 caracteres.",
  passwordMismatch: "As senhas não coincidem. Verifique e tente novamente.",
};

const SUCCESS_COPY = {
  recoveryEmailSent: "E-mail de recuperação enviado. Verifique sua caixa de entrada.",
  passwordSaved: "Senha alterada com sucesso. Voltando para a página inicial.",
};

const MAX_FAILED_ATTEMPTS = 3;
const RECOVERY_SUCCESS_REDIRECT_MS = 5000;
const CHECK_EMAIL_REDIRECT_MS = 5000;
const PASSWORD_SUCCESS_REDIRECT_MS = 2000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const [view, setView] = React.useState(() => HASH_TO_VIEW[window.location.hash] || "login");
  const [bootPhase, setBootPhase] = React.useState("active");
  const [loginTransitionPhase, setLoginTransitionPhase] = React.useState("idle");
  const [contentVisible, setContentVisible] = React.useState(false);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [authError, setAuthError] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState({});
  const [formError, setFormError] = React.useState("");
  const [formSuccess, setFormSuccess] = React.useState("");
  const [recoverySentFeedback, setRecoverySentFeedback] = React.useState("");
  const [failedAttempts, setFailedAttempts] = React.useState(0);
  const [errorPulse, setErrorPulse] = React.useState(0);
  const [formEntering, setFormEntering] = React.useState(false);
  const errorTimeoutRef = React.useRef();
  const enterTimeoutRef = React.useRef();
  const bootStartTimeoutRef = React.useRef();
  const bootEndTimeoutRef = React.useRef();
  const recoveryRedirectTimeoutRef = React.useRef();
  const checkEmailRedirectTimeoutRef = React.useRef();
  const passwordSuccessTimeoutRef = React.useRef();
  const loginTransitionStartTimeoutRef = React.useRef();
  const loginTransitionEndTimeoutRef = React.useRef();

  React.useEffect(() => {
    bootStartTimeoutRef.current = window.setTimeout(() => {
      setBootPhase("leaving");
      setContentVisible(true);
    }, 1450);
    bootEndTimeoutRef.current = window.setTimeout(() => setBootPhase("done"), 2680);

    return () => {
      window.clearTimeout(errorTimeoutRef.current);
      window.clearTimeout(enterTimeoutRef.current);
      window.clearTimeout(bootStartTimeoutRef.current);
      window.clearTimeout(bootEndTimeoutRef.current);
      window.clearTimeout(recoveryRedirectTimeoutRef.current);
      window.clearTimeout(checkEmailRedirectTimeoutRef.current);
      window.clearTimeout(passwordSuccessTimeoutRef.current);
      window.clearTimeout(loginTransitionStartTimeoutRef.current);
      window.clearTimeout(loginTransitionEndTimeoutRef.current);
    };
  }, []);

  React.useEffect(() => {
    if (!contentVisible) return;

    window.clearTimeout(enterTimeoutRef.current);
    setFormEntering(true);
    enterTimeoutRef.current = window.setTimeout(() => setFormEntering(false), 680);
  }, [view, contentVisible]);

  React.useEffect(() => {
    window.clearTimeout(checkEmailRedirectTimeoutRef.current);

    if (view !== "recoverySent") return undefined;

    checkEmailRedirectTimeoutRef.current = window.setTimeout(() => {
      changeView("resetPassword");
    }, CHECK_EMAIL_REDIRECT_MS);

    return () => window.clearTimeout(checkEmailRedirectTimeoutRef.current);
  }, [view]);

  React.useEffect(() => {
    function handleHashChange() {
      setView(HASH_TO_VIEW[window.location.hash] || "login");
      dismissAuthError();
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function dismissAuthError() {
    window.clearTimeout(errorTimeoutRef.current);
    window.clearTimeout(recoveryRedirectTimeoutRef.current);
    window.clearTimeout(checkEmailRedirectTimeoutRef.current);
    window.clearTimeout(passwordSuccessTimeoutRef.current);
    window.clearTimeout(loginTransitionStartTimeoutRef.current);
    window.clearTimeout(loginTransitionEndTimeoutRef.current);
    setAuthError(false);
    setFieldErrors({});
    setFormError("");
    setFormSuccess("");
    setRecoverySentFeedback("");
  }

  function startSuccessfulLoginTransition() {
    window.clearTimeout(loginTransitionStartTimeoutRef.current);
    window.clearTimeout(loginTransitionEndTimeoutRef.current);
    dismissAuthError();
    setLoginTransitionPhase("active");

    loginTransitionStartTimeoutRef.current = window.setTimeout(() => {
      setView("internalDemo");
      window.history.pushState(null, "", VIEW_TO_HASH.internalDemo);
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      setLoginTransitionPhase("leaving");
    }, 1450);

    loginTransitionEndTimeoutRef.current = window.setTimeout(() => {
      setLoginTransitionPhase("idle");
    }, 2680);
  }

  function triggerAuthError({ fields = {}, form = "" }) {
    window.clearTimeout(errorTimeoutRef.current);
    setFieldErrors(fields);
    setFormError(form);
    setFormSuccess("");
    setRecoverySentFeedback("");
    setErrorPulse((current) => current + 1);
    setAuthError(true);
    errorTimeoutRef.current = window.setTimeout(() => setAuthError(false), 2200);
  }

  function showFormSuccess(message) {
    window.clearTimeout(errorTimeoutRef.current);
    window.clearTimeout(recoveryRedirectTimeoutRef.current);
    setAuthError(false);
    setFieldErrors({});
    setFormError("");
    setFormSuccess(message);
    setRecoverySentFeedback("");
  }

  function changeView(nextView) {
    if (nextView === view) return;

    dismissAuthError();
    setIsTransitioning(true);
    window.setTimeout(() => setView(nextView), 140);
    window.history.pushState(null, "", VIEW_TO_HASH[nextView] || "#login");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.setTimeout(() => setIsTransitioning(false), 1350);
  }

  function getEmailError(email) {
    if (!email) return ERROR_COPY.emptyEmail;
    if (!EMAIL_PATTERN.test(email)) return ERROR_COPY.invalidEmail;
    return "";
  }

  function getPasswordErrors(password, confirmation) {
    const errors = {};

    if (password.length < 8) {
      errors.newPassword = ERROR_COPY.passwordTooShort;
    }

    if (confirmation.length < 8) {
      errors.confirmPassword = ERROR_COPY.passwordTooShort;
    }

    if (password.length >= 8 && confirmation.length >= 8 && password !== confirmation) {
      errors.confirmPassword = ERROR_COPY.passwordMismatch;
    }

    return errors;
  }

  function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    if (view === "login") {
      const email = String(data.get("email") || "").trim();
      const normalizedEmail = email.toLowerCase();
      const password = String(data.get("password") || "");
      const nextFieldErrors = {};
      const emailError = getEmailError(email);

      if (emailError) nextFieldErrors.email = emailError;
      if (!password) nextFieldErrors.password = ERROR_COPY.emptyPassword;

      if (Object.keys(nextFieldErrors).length > 0) {
        triggerAuthError({ fields: nextFieldErrors });
        return;
      }

      const isDemoLogin = normalizedEmail === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password;

      if (!isDemoLogin) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
          changeView("blocked");
          return;
        }

        triggerAuthError({ form: ERROR_COPY.wrongCredentials });
        return;
      }

      setFailedAttempts(0);
      startSuccessfulLoginTransition();
      return;
    }

    if (view === "resetPassword") {
      const newPassword = String(data.get("newPassword") || "");
      const confirmPassword = String(data.get("confirmPassword") || "");
      const nextFieldErrors = getPasswordErrors(newPassword, confirmPassword);

      if (Object.keys(nextFieldErrors).length > 0) {
        triggerAuthError({ fields: nextFieldErrors });
        return;
      }

      showFormSuccess(SUCCESS_COPY.passwordSaved);
      passwordSuccessTimeoutRef.current = window.setTimeout(() => {
        changeView("login");
      }, PASSWORD_SUCCESS_REDIRECT_MS);
      return;
    }

    const recoveryEmail = String(data.get("recoveryEmail") || "").trim();
    const recoveryEmailError = getEmailError(recoveryEmail);

    if (recoveryEmailError) {
      triggerAuthError({ fields: { recoveryEmail: recoveryEmailError } });
      return;
    }

    showFormSuccess(SUCCESS_COPY.recoveryEmailSent);
    recoveryRedirectTimeoutRef.current = window.setTimeout(() => {
      changeView("recoverySent");
    }, RECOVERY_SUCCESS_REDIRECT_MS);
  }

  function handleRecoveryResend() {
    setRecoverySentFeedback(RECOVERY_SENT_COPY.resendFeedback);
  }

  const isFormView = view === "login" || view === "recovery" || view === "resetPassword";
  const isLoaderVisible = bootPhase !== "done" || loginTransitionPhase !== "idle";
  const isLoaderLeaving = bootPhase === "leaving" || loginTransitionPhase === "leaving";
  const copy = FORM_COPY[view];
  const notice = NOTICE_COPY[view];
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const showGenericCredentialError = view === "login" && Boolean(formError) && !hasFieldErrors;
  const formAlertMessage = formError || formSuccess;

  return (
    <main
      className={`auth-page ${bootPhase !== "done" ? "is-booting" : ""} ${contentVisible ? "is-content-ready" : ""} ${
        isTransitioning ? "is-transitioning" : ""
      } ${authError ? "is-auth-error" : ""} ${errorPulse % 2 === 0 ? "error-pulse-a" : "error-pulse-b"}`}
      aria-labelledby="auth-title"
      data-view={view}
    >
      <img className="bg-photo" src={backgroundUrl} alt="" aria-hidden="true" />
      <div className="bg-waves-stage" aria-hidden="true">
        <img className="bg-waves" src={wavesUrl} alt="" />
      </div>
      <div className="bg-tint color" aria-hidden="true" />
      <div className="bg-tint darken" aria-hidden="true" />
      <div className="motion-waves" aria-hidden="true">
        <span className="motion-wave wave-a" />
        <span className="motion-wave wave-b" />
        <span className="motion-wave wave-c" />
        <span className="motion-wave wave-d" />
      </div>

      <img className="brand-logo" src={logoUrl} alt="Faarkey" />

      {isFormView && (
        <form
          key={view}
          className={`auth-form ${view} ${formEntering ? "is-form-entering" : ""} ${authError ? "has-auth-error" : ""}`}
          onSubmit={handleSubmit}
          noValidate
        >
          <header className="form-heading">
            <h1 id="auth-title">{copy.title}</h1>
            <p>{copy.description}</p>
          </header>

          <p
            className={`form-alert ${formAlertMessage ? "is-visible" : ""} ${formSuccess ? "is-success" : ""}`}
            id="form-alert"
            role={formError ? "alert" : undefined}
          >
            {formAlertMessage}
          </p>

          {copy.fields.map((field, index) => {
            const fieldError = fieldErrors[field.name];
            const isInvalid = Boolean(fieldError) || showGenericCredentialError;
            const errorId = `${field.name}-error`;

            return (
              <label className={`field ${index > 0 ? "is-stacked" : ""}`} key={field.name}>
                <span>{field.label}</span>
                <input
                  type={field.type}
                  name={field.name}
                  autoComplete={field.autoComplete}
                  aria-label={field.label}
                  aria-invalid={isInvalid ? "true" : undefined}
                  aria-describedby={fieldError ? errorId : undefined}
                  onInput={authError || formError || formSuccess || hasFieldErrors ? dismissAuthError : undefined}
                />
                {fieldError && (
                  <small className="field-error" id={errorId} role="alert">
                    {fieldError}
                  </small>
                )}
              </label>
            );
          })}

          <button className="submit-button" type="submit">
            {copy.submit}
          </button>
          {copy.link && (
            <button
              type="button"
              className="form-link"
              onClick={(event) => {
                event.preventDefault();
                changeView(view === "login" ? "recovery" : "login");
              }}
            >
              {copy.link}
            </button>
          )}
          <p className="sr-only" aria-live="polite">
            {formAlertMessage || Object.values(fieldErrors).join(" ")}
          </p>
        </form>
      )}

      {notice && (
        <section className={`notice-screen ${view}`} aria-labelledby="auth-title" aria-live="polite">
          <h1 id="auth-title">{notice.title}</h1>
          <p>{notice.description}</p>
        </section>
      )}

      {view === "recoverySent" && (
        <section className="recovery-check-screen" aria-labelledby="auth-title" aria-live="polite">
          <h1 id="auth-title">{RECOVERY_SENT_COPY.title}</h1>
          <p>{RECOVERY_SENT_COPY.description}</p>
          <button type="button" className="submit-button recovery-resend-button" onClick={handleRecoveryResend}>
            {RECOVERY_SENT_COPY.action}
          </button>
          <p className={`recovery-check-feedback ${recoverySentFeedback ? "is-visible" : ""}`} role="status">
            {recoverySentFeedback}
          </p>
          <button type="button" className="form-link recovery-login-link" onClick={() => changeView("login")}>
            {RECOVERY_SENT_COPY.loginLink}
          </button>
        </section>
      )}

      {view === "internalDemo" && (
        <section className="internal-demo-screen" aria-labelledby="auth-title">
          <h1 id="auth-title">{INTERNAL_DEMO_COPY.title}</h1>
          <p>{INTERNAL_DEMO_COPY.description}</p>
        </section>
      )}

      {isLoaderVisible && (
        <div className={`boot-loader ${isLoaderLeaving ? "is-leaving" : ""}`} aria-hidden="true">
          <img className="boot-waves" src={wavesUrl} alt="" />
          <span className="boot-ring ring-one" />
          <span className="boot-ring ring-two" />
          <img className="boot-logo" src={logoUrl} alt="" />
        </div>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<LoginPage />);
