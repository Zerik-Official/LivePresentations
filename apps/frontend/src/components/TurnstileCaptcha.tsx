import { Turnstile } from "@marsidev/react-turnstile";

interface Props {
  siteKey: string;
  onToken: (token: string | null) => void;
  /** Change it to get a fresh challenge; each token can be verified only once */
  resetKey?: number;
}

/**
 * Cloudflare Turnstile widget.
 * @param siteKey - Public site key
 * @param onToken - Receives the token, or null when it expires or fails
 * @param resetKey - Remounts the widget when it changes
 * @returns Captcha widget
 */
export function TurnstileCaptcha({ siteKey, onToken, resetKey = 0 }: Props): React.ReactNode {
  return (
    <div className="mt-4 flex justify-center overflow-hidden">
      <Turnstile key={resetKey} siteKey={siteKey} onSuccess={(token: string) => onToken(token)} onExpire={() => onToken(null)} onError={() => onToken(null)} />
    </div>
  );
}
