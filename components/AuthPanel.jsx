"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const LOGIN_INITIAL = { email: "", password: "" };
const REGISTER_INITIAL = { name: "", email: "", password: "" };
const FEEDBACK_INITIAL = { loading: false, error: "", success: "" };

/** concat clases simple */
function cn(...args) {
  return args.filter(Boolean).join(" ");
}

const SLIDE_DURATION = 700;   // ms
const CONTENT_DURATION = 500; // ms
const EASING = "cubic-bezier(0.22,1,0.36,1)"; // easeOutExpo-ish

/**
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - mode?: 'login' | 'register'    // ← ahora sí se respeta
 * - hideHeader?: boolean
 * - overlayBlurMd?: boolean        // blur solo en md+ (off por defecto)
 * - closeOnOverlay?: boolean       // true por defecto
 * - title?: string                 // si no se define, se usa según el modo
 * - children?: ReactNode           // si lo pasas, reemplaza el contenido por defecto
 */
export default function AuthPanel({
  open = false,
  onClose,
  mode = "login",
  hideHeader = false,
  overlayBlurMd = false,
  closeOnOverlay = true,
  title,
  children,
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);
  const [view, setView] = useState(mode); // ← estado de vista interna (login/register)
  const closeBtnRef = useRef(null);
  const closeTimerRef = useRef(null);
  const [loginForm, setLoginForm] = useState(() => ({ ...LOGIN_INITIAL }));
  const [registerForm, setRegisterForm] = useState(() => ({ ...REGISTER_INITIAL }));
  const [loginFeedback, setLoginFeedback] = useState(() => ({ ...FEEDBACK_INITIAL }));
  const [registerFeedback, setRegisterFeedback] = useState(() => ({ ...FEEDBACK_INITIAL }));

  const resetForms = useCallback(() => {
    setLoginForm(() => ({ ...LOGIN_INITIAL }));
    setRegisterForm(() => ({ ...REGISTER_INITIAL }));
    setLoginFeedback(() => ({ ...FEEDBACK_INITIAL }));
    setRegisterFeedback(() => ({ ...FEEDBACK_INITIAL }));
  }, []);

  useEffect(() => () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  // Mantén la vista sincronizada con la prop "mode" cuando cambie desde afuera
  useEffect(() => {
    setView(mode);
  }, [mode]);

  useEffect(() => {
    if (!open) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      resetForms();
    }
  }, [open, resetForms]);

  useEffect(() => {
    setLoginFeedback(() => ({ ...FEEDBACK_INITIAL }));
    setRegisterFeedback(() => ({ ...FEEDBACK_INITIAL }));
  }, [view]);

  // ENTRADA: doble rAF para asegurar el primer paint antes de animar
  useEffect(() => {
    if (open) {
      setMounted(true);
      let id1, id2;
      id1 = requestAnimationFrame(() => {
        id2 = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(id1);
        cancelAnimationFrame(id2);
      };
    } else {
      // SALIDA normal
      setVisible(false);
      const t = setTimeout(() => setMounted(false), SLIDE_DURATION);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Bloquear scroll de body cuando está abierto (se activa tras montar)
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  // Escape para cerrar
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose]
  );
  useEffect(() => {
    if (!mounted) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mounted, handleKeyDown]);

  // Enfocar botón cerrar AL FINAL de la animación de contenido (evita jank al entrar)
  useEffect(() => {
    if (mounted && visible && !hideHeader) {
      const t = setTimeout(() => closeBtnRef.current?.focus?.(), CONTENT_DURATION + 40);
      return () => clearTimeout(t);
    }
  }, [mounted, visible, hideHeader]);

  const scheduleClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      onClose?.();
      window.location.href = "/";
      closeTimerRef.current = null;
    }, 1200);
  }, [onClose]);

  const handleLoginChange = (field) => (event) => {
    const value = event.target.value;
    setLoginForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegisterChange = (field) => (event) => {
    const value = event.target.value;
    setRegisterForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    if (loginFeedback.loading) return;
    setLoginFeedback(() => ({ loading: true, error: "", success: "" }));

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: loginForm.email.trim(),
          password: loginForm.password,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        const message = data?.message || "No se pudo iniciar sesión. Revisa tus datos.";
        setLoginFeedback(() => ({ loading: false, error: message, success: "" }));
        return;
      }

      const name = data?.user?.name?.trim();
      setLoginFeedback(() => ({
        loading: false,
        error: "",
        success: name ? `Ingreso exitoso. ¡Bienvenido, ${name}!` : "Ingreso exitoso.",
      }));
      setLoginForm(() => ({ ...LOGIN_INITIAL }));
      scheduleClose();
    } catch (err) {
      setLoginFeedback(() => ({
        loading: false,
        error: "Ocurrió un problema. Intenta nuevamente.",
        success: "",
      }));
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    if (registerFeedback.loading) return;
    setRegisterFeedback(() => ({ loading: true, error: "", success: "" }));

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: registerForm.name.trim(),
          email: registerForm.email.trim(),
          password: registerForm.password,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        const message = data?.message || "No se pudo crear la cuenta. Revisa tus datos.";
        setRegisterFeedback(() => ({ loading: false, error: message, success: "" }));
        return;
      }

      const name = data?.user?.name?.trim();
      setRegisterFeedback(() => ({
        loading: false,
        error: "",
        success: name
          ? `Cuenta creada con éxito. ¡Bienvenido, ${name}!`
          : "Cuenta creada con éxito.",
      }));
      setRegisterForm(() => ({ ...REGISTER_INITIAL }));
      scheduleClose();
    } catch (err) {
      setRegisterFeedback(() => ({
        loading: false,
        error: "Ocurrió un problema. Intenta nuevamente.",
        success: "",
      }));
    }
  };

  if (!mounted) return null;

  // Títulos por modo (si no se provee title)
  const computedTitle = title ?? (view === "register" ? "Crear cuenta" : "Inicia sesión");

  // --- Contenido por defecto (login/register) ---
  const DefaultLogin = (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">
        Bienvenido. Inicia sesión para continuar.
      </p>

      <form className="space-y-3" onSubmit={handleLoginSubmit}>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-800">Email</label>
          <input
            type="email"
            className={cn(
              "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
              loginFeedback.loading && "opacity-80 cursor-not-allowed"
            )}
            placeholder="tucorreo@ejemplo.com"
            value={loginForm.email}
            onChange={handleLoginChange("email")}
            autoComplete="email"
            disabled={loginFeedback.loading}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-800">Contraseña</label>
          <input
            type="password"
            className={cn(
              "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
              loginFeedback.loading && "opacity-80 cursor-not-allowed"
            )}
            placeholder="********"
            value={loginForm.password}
            onChange={handleLoginChange("password")}
            autoComplete="current-password"
            disabled={loginFeedback.loading}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="rounded border-gray-300" disabled={loginFeedback.loading} /> Recuérdame
          </label>
          <button type="button" className="text-sm text-indigo-600 hover:underline" disabled={loginFeedback.loading}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {loginFeedback.error && (
          <p className="text-sm text-red-600" role="alert">
            {loginFeedback.error}
          </p>
        )}
        {loginFeedback.success && (
          <p className="text-sm text-green-600" role="status">
            {loginFeedback.success}
          </p>
        )}

        <button
          type="submit"
          className={cn(
            "mt-2 w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-[transform,opacity] hover:opacity-95 active:translate-y-px",
            loginFeedback.loading && "opacity-80 cursor-not-allowed"
          )}
          disabled={loginFeedback.loading}
        >
          {loginFeedback.loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <div className="pt-2 text-center text-sm text-gray-600">
        ¿No tienes cuenta?{" "}
        <button
          type="button"
          onClick={() => setView("register")}
          className="font-medium text-indigo-600 hover:underline"
          disabled={loginFeedback.loading}
        >
          Crear una
        </button>
      </div>
    </div>
  );

  const DefaultRegister = (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">
        Crea tu cuenta para comenzar.
      </p>

      <form className="space-y-3" onSubmit={handleRegisterSubmit}>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-800">Nombre</label>
          <input
            type="text"
            className={cn(
              "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
              registerFeedback.loading && "opacity-80 cursor-not-allowed"
            )}
            placeholder="Tu nombre"
            value={registerForm.name}
            onChange={handleRegisterChange("name")}
            autoComplete="name"
            disabled={registerFeedback.loading}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-800">Email</label>
          <input
            type="email"
            className={cn(
              "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
              registerFeedback.loading && "opacity-80 cursor-not-allowed"
            )}
            placeholder="tucorreo@ejemplo.com"
            value={registerForm.email}
            onChange={handleRegisterChange("email")}
            autoComplete="email"
            disabled={registerFeedback.loading}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-800">Contraseña</label>
          <input
            type="password"
            className={cn(
              "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
              registerFeedback.loading && "opacity-80 cursor-not-allowed"
            )}
            placeholder="********"
            value={registerForm.password}
            onChange={handleRegisterChange("password")}
            autoComplete="new-password"
            disabled={registerFeedback.loading}
          />
        </div>

        {registerFeedback.error && (
          <p className="text-sm text-red-600" role="alert">
            {registerFeedback.error}
          </p>
        )}
        {registerFeedback.success && (
          <p className="text-sm text-green-600" role="status">
            {registerFeedback.success}
          </p>
        )}

        <button
          type="submit"
          className={cn(
            "mt-2 w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-[transform,opacity] hover:opacity-95 active:translate-y-px",
            registerFeedback.loading && "opacity-80 cursor-not-allowed"
          )}
          disabled={registerFeedback.loading}
        >
          {registerFeedback.loading ? "Creando..." : "Crear cuenta"}
        </button>
      </form>

      <div className="pt-2 text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{" "}
        <button
          type="button"
          onClick={() => setView("login")}
          className="font-medium text-indigo-600 hover:underline"
          disabled={registerFeedback.loading}
        >
          Inicia sesión
        </button>
      </div>
    </div>
  );

  const Content = children ?? (view === "register" ? DefaultRegister : DefaultLogin);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-stretch justify-start"
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay (sin blur por defecto; opcional md:backdrop-blur-sm) */}
      <button
        aria-label="Cerrar panel"
        onClick={closeOnOverlay ? onClose : undefined}
        className={cn(
          "absolute inset-0 bg-gray-900/60 transition-opacity duration-[360ms]",
          overlayBlurMd && "md:backdrop-blur-sm",
          visible ? "opacity-100" : "opacity-0"
        )}
        style={{ transitionTimingFunction: EASING }}
      />

      {/* Panel (GPU + contain + backface hidden para máxima fluidez) */}
      <aside
        className={cn(
          "relative mr-auto h-full w-full max-w-xl bg-white",
          "shadow-lg md:shadow-2xl",
          "transform-gpu will-change-transform transition-transform",
          "[backface-visibility:hidden]",
          visible ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          transitionDuration: `${SLIDE_DURATION}ms`,
          transitionTimingFunction: EASING,
          contain: "paint",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Contenido con fade/translate (más corto que el slide) */}
        <div
          className={cn(
            "flex h-full flex-col transition-[opacity,transform]",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
          style={{
            transitionDuration: `${CONTENT_DURATION}ms`,
            transitionTimingFunction: EASING,
          }}
        >
          {/* Header opcional */}
          {!hideHeader && (
            <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">{computedTitle}</h2>
              <button
                ref={closeBtnRef}
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Área scrollable */}
          <div className={cn("flex-1 overflow-y-auto", hideHeader ? "p-5 md:p-6" : "px-5 pb-6 pt-4")}>
            {Content}
          </div>
        </div>
      </aside>
    </div>
  );
}
