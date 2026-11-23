interface Props {
  message: string | null;
}

/** Messaggio temporaneo al centro dello schermo */
export function MissionPopup({ message }: Props) {
  if (!message) return null;
  return <div className="hud-message">{message}</div>;
}
