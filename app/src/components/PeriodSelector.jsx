import { CaretDown } from "@phosphor-icons/react";
import { PRESETS, usePeriod } from "../context/PeriodContext";
import DateRangePicker from "./DateRangePicker";
import MonthPicker from "./MonthPicker";
import "./PeriodSelector.css";

export default function PeriodSelector() {
  const { preset, custom, month, setPreset, setCustomRange, setMonth } = usePeriod();

  return (
    <div className="period-selector">
      <div className="select-wrap">
        <select aria-label="Período" value={preset} onChange={(e) => setPreset(e.target.value)}>
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <CaretDown size={14} weight="bold" className="select-caret" />
      </div>

      {preset === "mes-especifico" && (
        <MonthPicker tema="escuro" ariaLabel="Mês" value={month} onChange={setMonth} />
      )}

      {preset === "custom" && (
        <DateRangePicker
          tema="escuro"
          limpavel={false}
          ariaLabel="Período personalizado"
          placeholder="Escolher datas"
          de={custom.start ?? ""}
          ate={custom.end ?? ""}
          onChange={({ de, ate }) => setCustomRange({ start: de, end: ate })}
        />
      )}
    </div>
  );
}
