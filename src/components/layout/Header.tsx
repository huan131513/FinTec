export function Header() {
  return (
    <header className="border-b border-card-border bg-card/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent font-bold text-white text-sm">
            FT
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">FinTec</h1>
            <p className="text-xs text-muted">mNAV Monitor</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-card-border bg-card px-3 py-1.5 text-sm">
          <span className="text-muted">Tracking:</span>
          <span className="font-medium text-accent">MSTR</span>
          <span className="text-muted">Strategy</span>
        </div>
      </div>
    </header>
  );
}
