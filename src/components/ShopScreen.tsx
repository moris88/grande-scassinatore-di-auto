import type { ShopHud } from "../game/hud";

interface Props {
  shop: ShopHud;
  money: number;
}

const money = (n: number): string => `$${n.toLocaleString("it-IT")}`;

/** Interno del negozio a schermata separata: il mondo è fermo finché non si esce */
export function ShopScreen({ shop, money: cash }: Props) {
  return (
    <div className="overlay shop">
      <div className="panel shop-panel">
        <div className="shop-sign">{shop.title}</div>
        <div className="shop-counter" />
        <p className="score">Hai {money(cash)}</p>
        <ul className="shop-items">
          {shop.items.map((item, i) => (
            <li key={item.label} className={item.affordable ? "" : "too-expensive"}>
              <span className="shop-key">[{i + 1}]</span> {item.label}
              <span className="shop-price">{money(item.price)}</span>
            </li>
          ))}
        </ul>
        <p className="shop-notice">{shop.notice}</p>
        <p className="controls">Tasti 1–{shop.items.length}: compra · E / Esc: esci</p>
      </div>
    </div>
  );
}
