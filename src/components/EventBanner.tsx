export type BannerKind = "wasted" | "busted" | "success";

interface Props {
  kind: BannerKind;
  /** Riga secondaria (es. la ricompensa) */
  detail?: string;
}

const TITLES: Record<BannerKind, string> = {
  wasted: "SEI MORTO",
  busted: "ARRESTATO",
  success: "MISSIONE COMPIUTA!",
};

/** Schermata a tutto schermo che si ingrandisce per evidenziare un evento */
export function EventBanner({ kind, detail }: Props) {
  return (
    <div className={`event-banner event-${kind}`}>
      <div key={kind} className="event-title">
        {TITLES[kind]}
        {detail && <div className="event-detail">{detail}</div>}
      </div>
    </div>
  );
}
