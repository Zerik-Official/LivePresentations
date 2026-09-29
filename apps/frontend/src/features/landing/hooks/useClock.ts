import { useEffect, useState } from "react";

function format(date: Date): string {
  return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function useClock(): string {
  const [time, setTime] = useState(() => format(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => setTime(format(new Date())), 15_000);
    return () => window.clearInterval(id);
  }, []);

  return time;
}
