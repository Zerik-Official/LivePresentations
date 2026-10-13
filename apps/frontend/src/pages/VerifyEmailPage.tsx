import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { OtpInput } from "@/components/OtpInput";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { AuthShell } from "@/features/auth/AuthShell";
import { useAuthResult } from "@/features/auth/useAuthResult";
import { clearPendingVerification, loadPendingVerification, storePendingVerification, toPendingVerification, type PendingVerification } from "@/features/auth/verification";
import { authApi } from "@/lib/api";

const CODE_LENGTH = 6;

/**
 * Format a number of seconds as m:ss.
 * @param seconds - Seconds remaining
 * @returns Clock text
 */
function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Email verification step: the user types the emailed one-time code.
 * It cannot be skipped: no session exists until the code is confirmed, and
 * logging in again leads back here.
 */
export function VerifyEmailPage(): React.ReactNode {
  const applyResult = useAuthResult();
  const [pending, setPending] = useState<PendingVerification | null>(loadPendingVerification);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!pending) return <Navigate to="/login" replace />;

  const resendIn = Math.max(0, Math.ceil((pending.resendAt - now) / 1000));
  const expiresIn = Math.max(0, Math.ceil((pending.expiresAt - now) / 1000));

  /**
   * Submit the code.
   * @param value - Code to verify
   */
  async function verify(value: string): Promise<void> {
    if (!pending || value.length !== CODE_LENGTH || verifying) return;
    setError(null);
    setNotice(null);
    setVerifying(true);
    try {
      applyResult(await authApi.verifyEmail(pending.ticket, value));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo verificar el código");
      setCode("");
    } finally {
      setVerifying(false);
    }
  }

  /**
   * Request a new code once the cooldown has passed.
   */
  async function resend(): Promise<void> {
    if (!pending || resendIn > 0 || resending) return;
    setError(null);
    setNotice(null);
    setResending(true);
    try {
      const status = await authApi.resendCode(pending.ticket);
      const next = toPendingVerification(pending.email, pending.ticket, status.resend_in, status.expires_in);
      storePendingVerification(next);
      setPending(next);
      setCode("");
      setNotice(status.sent ? "Te hemos enviado un código nuevo." : "Todavía no puedes pedir otro código.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el código");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell title="Verifica tu correo" subtitle={`Introduce el código de ${CODE_LENGTH} dígitos enviado a ${pending.email}`} error={error}>
      {notice && <p className="mt-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-3 py-2 text-center text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          void verify(code);
        }}
      >
        <OtpInput length={CODE_LENGTH} value={code} onChange={setCode} onComplete={(value) => void verify(value)} disabled={verifying} invalid={Boolean(error)} />

        <p className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">{expiresIn > 0 ? `El código caduca en ${formatClock(expiresIn)}` : "El código ha caducado. Solicita uno nuevo."}</p>

        <Button type="submit" variant="primary" size="lg" disabled={verifying || code.length !== CODE_LENGTH} className="mt-5 w-full cursor-pointer">
          {verifying ? (
            <>
              <Spinner className="size-4 text-white dark:text-zinc-900" /> Verificando...
            </>
          ) : (
            "Verificar y entrar"
          )}
        </Button>
      </form>

      <Button variant="ghost" size="md" disabled={resendIn > 0 || resending} onClick={() => void resend()} className="mt-2 w-full">
        {resending ? <Spinner className="size-4" /> : null}
        {resendIn > 0 ? `Reenviar código en ${formatClock(resendIn)}` : "Reenviar código"}
      </Button>

      <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
        ¿No es tu correo?{" "}
        <Link to="/login" onClick={clearPendingVerification} className="cursor-pointer font-medium text-zinc-900 dark:text-zinc-100 underline decoration-zinc-300 dark:decoration-zinc-600 underline-offset-4">
          Usar otra cuenta
        </Link>
      </p>
    </AuthShell>
  );
}
