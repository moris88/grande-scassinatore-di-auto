/** Stato della tastiera: tasti tenuti premuti e tasti appena premuti */
export class Input {
  private held = new Set<string>();
  private pressed = new Set<string>();

  private onDown = (e: KeyboardEvent): void => {
    if (!this.held.has(e.code)) this.pressed.add(e.code);
    this.held.add(e.code);
    if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault();
  };

  private onUp = (e: KeyboardEvent): void => {
    this.held.delete(e.code);
  };

  private onBlur = (): void => {
    this.held.clear();
  };

  attach(): void {
    window.addEventListener("keydown", this.onDown);
    window.addEventListener("keyup", this.onUp);
    window.addEventListener("blur", this.onBlur);
  }

  detach(): void {
    window.removeEventListener("keydown", this.onDown);
    window.removeEventListener("keyup", this.onUp);
    window.removeEventListener("blur", this.onBlur);
  }

  isDown(...codes: string[]): boolean {
    return codes.some((c) => this.held.has(c));
  }

  wasPressed(...codes: string[]): boolean {
    return codes.some((c) => this.pressed.has(c));
  }

  /** Da chiamare a fine frame logico */
  endFrame(): void {
    this.pressed.clear();
  }

  axisY(): number {
    return (this.isDown("ArrowUp", "KeyW") ? 1 : 0) - (this.isDown("ArrowDown", "KeyS") ? 1 : 0);
  }

  axisX(): number {
    return (this.isDown("ArrowRight", "KeyD") ? 1 : 0) - (this.isDown("ArrowLeft", "KeyA") ? 1 : 0);
  }
}
