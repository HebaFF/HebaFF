"use client";

import { useMemo, useState } from "react";
import { Card, TextInput, Modal, Button, Badge, SegmentedControl, Field } from "@/components/ui";
import { FOOD_DB, type Food } from "@/lib/foodDb";
import { useAppData } from "@/context/AppDataContext";
import { convertBG, calcCarbRise, mealDose as calcMealDose, correctionDose, hypoCarbsNeeded, round2 } from "@/lib/calc";
import type { ProfileDTO } from "@/lib/profileDto";

function foodKey(f: { name: string; portion: string }) {
  return f.name + "|" + f.portion;
}

function FoodPicker({ foods, onAdd }: { foods: (Food & { custom?: boolean })[]; onAdd: (f: Food) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const categories = useMemo(() => ["All", ...Array.from(new Set(foods.map((f) => f.category)))], [foods]);
  const filtered = useMemo(
    () =>
      foods
        .filter((f) => (category === "All" || f.category === category) && f.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 40),
    [foods, query, category],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <TextInput placeholder="Search food… e.g. rice, banana" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            style={{
              flexShrink: 0,
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
              border: category === c ? "1.5px solid var(--primary)" : "1px solid var(--border)",
              background: category === c ? "var(--primary-tint)" : "var(--surface)",
              color: category === c ? "var(--primary-dark)" : "var(--text-2)",
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
        {filtered.length === 0 && <div style={{ fontSize: 13, color: "var(--text-3)", padding: "10px 2px" }}>No foods found.</div>}
        {filtered.map((f) => (
          <button
            key={foodKey(f)}
            onClick={() => onAdd(f)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              textAlign: "left",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "10px 12px",
              background: "var(--surface)",
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {f.name}
                {f.custom && (
                  <span style={{ marginLeft: 6 }}>
                    <Badge tone="neutral">mine</Badge>
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>{f.portion}</div>
            </div>
            <div className="num" style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>
              {f.carbs}g
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SuggestFoodModal({
  open,
  onClose,
  onSuggest,
}: {
  open: boolean;
  onClose: () => void;
  onSuggest: (f: { name: string; portion: string; carbs: number; category: string }) => void;
}) {
  const [name, setName] = useState("");
  const [portion, setPortion] = useState("");
  const [carbs, setCarbs] = useState("");
  function submit() {
    if (!name.trim() || !carbs) return;
    onSuggest({ name: name.trim(), category: "My Foods", portion: portion.trim() || "1 portion", carbs: Number(carbs) });
    setName("");
    setPortion("");
    setCarbs("");
    onClose();
  }
  return (
    <Modal open={open} onClose={onClose} title="Add your own food">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Food name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mom's stuffed cabbage" />
        </Field>
        <Field label="Portion size">
          <TextInput value={portion} onChange={(e) => setPortion(e.target.value)} placeholder="e.g. 1 roll (80g)" />
        </Field>
        <Field label="Carbs (g) per portion">
          <TextInput type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="e.g. 18" />
        </Field>
        <Button full onClick={submit}>
          Add to my foods
        </Button>
      </div>
    </Modal>
  );
}

type Mode = "meal" | "mealCorrection" | "correction" | "hypo";

export function CalculatorWidget({ profile }: { profile: ProfileDTO }) {
  const { foods: customFoods, logEntry, addCustomFood } = useAppData();
  const [mode, setMode] = useState<Mode>("meal");
  const [items, setItems] = useState<{ food: Food; qty: number }[]>([]);
  const [currentBG, setCurrentBG] = useState("");
  const [targetBG, setTargetBG] = useState(profile.units === "mmol" ? "7.2" : "130");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const allFoods = useMemo(() => [...customFoods, ...FOOD_DB], [customFoods]);
  const usesInsulin = profile.tdd > 0 && !!profile.carbRatio && !!profile.isf;

  const unit = profile.units === "mmol" ? "mmol/L" : "mg/dL";
  function toInternal(v: string) {
    const n = Number(v);
    if (!n) return 0;
    return profile.units === "mmol" ? n * 18.0182 : n;
  }
  function fromInternalDisplay(mgdl: number) {
    return convertBG(mgdl, profile.units);
  }

  const totalCarbs = items.reduce((s, it) => s + it.food.carbs * it.qty, 0);
  const curBGmgdl = toInternal(currentBG);
  const tgtBGmgdl = toInternal(targetBG);
  const carbRise = usesInsulin ? calcCarbRise(profile.isf!, profile.carbRatio!) : 0;

  const mealDoseVal = usesInsulin ? calcMealDose(totalCarbs, profile.carbRatio!) : 0;
  const correctionUnits = usesInsulin && curBGmgdl && tgtBGmgdl ? correctionDose(curBGmgdl, tgtBGmgdl, profile.isf!) : 0;
  const combinedDose = mealDoseVal + correctionUnits;
  const hypoCarbs = usesInsulin && curBGmgdl && tgtBGmgdl ? hypoCarbsNeeded(curBGmgdl, tgtBGmgdl, carbRise) : 0;

  function addItem(food: Food) {
    setItems((list) => {
      const idx = list.findIndex((it) => foodKey(it.food) === foodKey(food));
      if (idx >= 0) {
        const copy = [...list];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [...list, { food, qty: 1 }];
    });
    setPickerOpen(false);
  }
  function setQty(food: Food, qty: number) {
    setItems((list) =>
      qty <= 0
        ? list.filter((it) => foodKey(it.food) !== foodKey(food))
        : list.map((it) => (foodKey(it.food) === foodKey(food) ? { ...it, qty } : it)),
    );
  }

  async function logResult() {
    const foodsPayload = items.map((it) => ({ name: it.food.name, qty: it.qty, carbs: it.food.carbs }));
    if (mode === "meal") {
      await logEntry({ type: "meal", timestamp: Date.now(), foods: foodsPayload, carbs: round2(totalCarbs), dose: round2(mealDoseVal) });
    } else if (mode === "mealCorrection") {
      await logEntry({
        type: "mealCorrection",
        timestamp: Date.now(),
        foods: foodsPayload,
        carbs: round2(totalCarbs),
        currentBG: fromInternalDisplay(curBGmgdl),
        targetBG: fromInternalDisplay(tgtBGmgdl),
        dose: round2(combinedDose),
      });
    } else if (mode === "correction") {
      await logEntry({
        type: "correction",
        timestamp: Date.now(),
        currentBG: fromInternalDisplay(curBGmgdl),
        targetBG: fromInternalDisplay(tgtBGmgdl),
        dose: round2(correctionUnits),
      });
    } else if (mode === "hypo") {
      await logEntry({
        type: "hypo",
        timestamp: Date.now(),
        currentBG: fromInternalDisplay(curBGmgdl),
        targetBG: fromInternalDisplay(tgtBGmgdl),
        carbsNeeded: round2(hypoCarbs),
      });
    }
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
    if (mode === "meal" || mode === "mealCorrection") setItems([]);
  }

  const showFoodBuilder = mode === "meal" || mode === "mealCorrection";
  const showBGInputs = mode === "mealCorrection" || mode === "correction" || mode === "hypo";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {!usesInsulin && (
        <Card style={{ background: "var(--warn-tint)", border: "none", borderRadius: "var(--radius-sm)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "oklch(40% 0.12 75)" }}>No insulin dosing on file</div>
          <div style={{ fontSize: 12.5, color: "oklch(40% 0.1 75)", marginTop: 2 }}>
            You can still log carbs and glucose. Add insulin info in Setup to unlock dose calculations.
          </div>
        </Card>
      )}

      <SegmentedControl
        value={mode}
        onChange={setMode}
        options={[
          { value: "meal", label: "Meal" },
          { value: "mealCorrection", label: "Meal+Corr." },
        ]}
      />
      <SegmentedControl
        value={mode}
        onChange={setMode}
        options={[
          { value: "correction", label: "Correction only" },
          { value: "hypo", label: "Low BG (hypo)" },
        ]}
      />

      {showFoodBuilder && (
        <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>Meal items</div>
          {items.length === 0 && <div style={{ fontSize: 13, color: "var(--text-3)" }}>No items added yet.</div>}
          {items.map((it) => (
            <div key={foodKey(it.food)} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{it.food.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                  {it.food.portion} · {it.food.carbs}g carbs
                </div>
              </div>
              <button
                onClick={() => setQty(it.food, it.qty - 1)}
                style={{ width: 26, height: 26, borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)" }}
              >
                −
              </button>
              <span className="num" style={{ minWidth: 16, textAlign: "center", fontWeight: 700 }}>
                {it.qty}
              </span>
              <button
                onClick={() => setQty(it.food, it.qty + 1)}
                style={{ width: 26, height: 26, borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)" }}
              >
                +
              </button>
            </div>
          ))}
          <Button variant="secondary" onClick={() => setPickerOpen(true)}>
            + Add food from list
          </Button>
          <Button variant="outline" onClick={() => setSuggestOpen(true)}>
            + Add your own food
          </Button>
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: "1px solid var(--border)" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>Total carbs</span>
            <span className="num" style={{ fontSize: 15, fontWeight: 800 }}>
              {round2(totalCarbs)}g
            </span>
          </div>
        </Card>
      )}

      {showBGInputs && (
        <div style={{ display: "flex", gap: 12 }}>
          <Field label={`Current BG (${unit})`}>
            <TextInput
              type="number"
              value={currentBG}
              onChange={(e) => setCurrentBG(e.target.value)}
              placeholder={profile.units === "mmol" ? "13.9" : "250"}
            />
          </Field>
          <Field label={`Target BG (${unit})`}>
            <TextInput
              type="number"
              value={targetBG}
              onChange={(e) => setTargetBG(e.target.value)}
              placeholder={profile.units === "mmol" ? "7.2" : "130"}
            />
          </Field>
        </div>
      )}

      {usesInsulin && (
        <Card
          style={{
            background: mode === "hypo" ? "var(--danger)" : "var(--primary)",
            border: "none",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {mode === "meal" && (
            <>
              <div style={{ fontSize: 12, color: "oklch(100% 0 0 / 0.75)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Meal dose
              </div>
              <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, color: "white" }}>
                {round2(mealDoseVal)} <span style={{ fontSize: 16 }}>units</span>
              </div>
              <div style={{ fontSize: 12.5, color: "oklch(100% 0 0 / 0.8)" }}>
                {round2(totalCarbs)}g ÷ {round2(profile.carbRatio!)} g/unit
              </div>
            </>
          )}
          {mode === "mealCorrection" && (
            <>
              <div style={{ fontSize: 12, color: "oklch(100% 0 0 / 0.75)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Meal + correction dose
              </div>
              <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, color: "white" }}>
                {round2(combinedDose)} <span style={{ fontSize: 16 }}>units</span>
              </div>
              <div style={{ fontSize: 12.5, color: "oklch(100% 0 0 / 0.8)" }}>
                Meal {round2(mealDoseVal)}u + correction {round2(correctionUnits)}u
              </div>
            </>
          )}
          {mode === "correction" && (
            <>
              <div style={{ fontSize: 12, color: "oklch(100% 0 0 / 0.75)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Correction dose
              </div>
              <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, color: "white" }}>
                {round2(correctionUnits)} <span style={{ fontSize: 16 }}>units</span>
              </div>
              <div style={{ fontSize: 12.5, color: "oklch(100% 0 0 / 0.8)" }}>
                ({currentBG || 0} − {targetBG || 0}) ÷ {round2(profile.isf!)}
              </div>
            </>
          )}
          {mode === "hypo" && (
            <>
              <div style={{ fontSize: 12, color: "oklch(100% 0 0 / 0.8)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Carbs needed (low BG)
              </div>
              <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, color: "white" }}>
                {round2(hypoCarbs)} <span style={{ fontSize: 16 }}>g carbs</span>
              </div>
              <div style={{ fontSize: 12.5, color: "oklch(100% 0 0 / 0.85)" }}>Treat the low first — recheck BG in 15 minutes.</div>
            </>
          )}
          <Button onClick={logResult} style={{ background: "white", color: mode === "hypo" ? "var(--danger)" : "var(--primary-dark)" }}>
            {savedFlash ? "Saved ✓" : "Log this"}
          </Button>
        </Card>
      )}

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Add a food">
        <FoodPicker foods={allFoods} onAdd={addItem} />
      </Modal>
      <SuggestFoodModal open={suggestOpen} onClose={() => setSuggestOpen(false)} onSuggest={addCustomFood} />
    </div>
  );
}
