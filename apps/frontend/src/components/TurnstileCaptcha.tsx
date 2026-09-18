import { Turnstile } from "@marsidev/react-turnstile";

interface Props {
  siteKey: string;
  onToken: (token: string | null) => void;
}

export function TurnstileCaptcha({ siteKey, onToken }: Props): React.ReactNode {
  return (
    <div className="mt-4 flex justify-center overflow-hidden">
      <Turnstile
        siteKey={siteKey}
        onSuccess={(token: string) => onToken(token)}
        onExpire={() => onToken(null)}
        onError={() => onToken(null)}
      />
    </div>
  );
}