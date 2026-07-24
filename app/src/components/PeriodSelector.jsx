import { CaretDown } from "@phosphor-icons/react";
import { PRESETS, usePeriod } from "../context/PeriodContext";
import "./PeriodSelector.css";

export default function PeriodSelector() {
  const { preset, custom, month, setPreset, setCustomRange, setMonth } = usePeriod();

  return (
    <div className="period-selector">
      <div className="select-wrap">
        <select value={preset} onChange={(e) => setPreset(e.target.value)}>
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <CaretDown size={14} weight="bold" className="select-caret" />
      </div>

      {preset === "mes-especifico" && (
        <div className="period-custom">
          <input type="month" lang="pt-BR" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
      )}

      {preset === "custom" && (
        <div className="period-custom">
          <input
            type="date"
            lang="pt-BR"
            value={custom.start ?? ""}
            onChange={(e) => setCustomRange({ ...custom, start: e.target.value })}
          />
          <span>até</span>
          <input
            type="date"
            lang="pt-BR"
            value={custom.end ?? ""}
            onChange={(e) => setCustomRange({ ...custom, end: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
