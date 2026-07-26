"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, TextInput, TextArea, Modal, Button, Badge, SegmentedControl, Field } from "@/components/ui";
import { DropIcon, TargetIcon, NoteIcon, PlusIcon, MinusIcon } from "@/components/icons";
import { FOOD_DB, type Food as RawFood } from "@/lib/foodDb";
import type { Food } from "@/lib/api";
import { useAppData } from "@/context/AppDataContext";
import { useLang } from "@/context/LangContext";
import { convertBG, calcCarbRise, mealDose as calcMealDose, correctionDose, hypoCarbsNeeded, round2 } from "@/lib/calc";
import type { ProfileDTO } from "@/lib/profileDto";

// Prefer the stable id when present — some distinct foods (curated DB entries or, in
// principle, two custom foods) can share the same localized name+portion text, which
// would otherwise collide as a React key and as the cart merge key.
function foodKey(f: { id?: string; name: string; portion: string }) {
  return f.id ?? f.name + "|" + f.portion;
}

function localizeFood(f: RawFood, lang: "en" | "ar"): Food {
  return { id: f.id, name: f.name[lang], category: f.category[lang], portion: f.portion[lang], carbs: f.carbs };
}

function LogRow({
  icon,
  label,
  children,
  divider = true,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  divider?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        paddingBottom: divider ? 14 : 0,
        marginBottom: divider ? 14 : 0,
        borderBottom: divider ? "1px solid var(--border)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-2)" }}>
        <span style={{ display: "flex", lineHeight: 1 }}>{icon}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function FoodPicker({ foods, onAdd }: { foods: (Food & { custom?: boolean })[]; onAdd: (f: Food) => void }) {
  const { t } = useLang();
  const T = t.calculator;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(T.allCategory);
  const categories = useMemo(() => [T.allCategory, ...Array.from(new Set(foods.map((f) => f.category)))], [foods, T.allCategory]);
  const filtered = useMemo(
    () => foods.filter((f) => (category === T.allCategory || f.category === category) && f.name.toLowerCase().includes(query.toLowerCase())),
    [foods, query, category, T.allCategory],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <TextInput placeholder={T.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} />
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
        {filtered.length === 0 && <div style={{ fontSize: 13, color: "var(--text-3)", padding: "10px 2px" }}>{T.noFoodsFound}</div>}
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
                    <Badge tone="neutral">{T.mineTag}</Badge>
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>{f.portion}</div>
            </div>
            <div className="num" style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>
              {T.gramsShort(f.carbs)}
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
  const { t } = useLang();
  const T = t.calculator;
  const [name, setName] = useState("");
  const [portion, setPortion] = useState("");
  const [carbs, setCarbs] = useState("");
  function submit() {
    if (!name.trim() || !carbs) return;
    onSuggest({ name: name.trim(), category: T.myFoodsCategory, portion: portion.trim() || T.onePortionFallback, carbs: Number(carbs) });
    setName("");
    setPortion("");
    setCarbs("");
    onClose();
  }
  return (
    <Modal open={open} onClose={onClose} title={T.addYourOwnFoodTitle}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label={T.foodNameLabel}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder={T.foodNamePlaceholder} />
        </Field>
        <Field label={T.portionLabel}>
          <TextInput value={portion} onChange={(e) => setPortion(e.target.value)} placeholder={T.portionPlaceholder} />
        </Field>
        <Field label={T.carbsPerPortionLabel}>
          <TextInput type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder={T.carbsPlaceholder} />
        </Field>
        <Button full onClick={submit}>
          {T.addToMyFoods}
        </Button>
      </div>
    </Modal>
  );
}

type Mode = "meal" | "mealCorrection" | "correction" | "hypo";

export function CalculatorWidget({ profile }: { profile: ProfileDTO }) {
  const { t, lang } = useLang();
  const T = t.calculator;
  const router = useRouter();
  const { foods: customFoods, logEntry, addCustomFood } = useAppData();
  const [mode, setMode] = useState<Mode>("meal");
  const [items, setItems] = useState<{ food: Food; qty: number }[]>([]);
  const [currentBG, setCurrentBG] = useState("");
  const [targetBG, setTargetBG] = useState(profile.units === "mmol" ? "7.2" : "130");
  const [notes, setNotes] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const allFoods = useMemo(
    () => [...customFoods, ...FOOD_DB.map((f) => localizeFood(f, lang))],
    [customFoods, lang],
  );
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

  // logResult only ever runs from the "Log this" onClick below, never during
  // render, so Date.now() here is safe despite the lexically-scoped lint rule.
  /* eslint-disable react-hooks/purity -- event handler, not render */
  async function logResult() {
    const foodsPayload = items.map((it) => ({ name: it.food.name, qty: it.qty, carbs: it.food.carbs }));
    const notesPayload = notes.trim() ? { notes: notes.trim() } : {};
    if (mode === "meal") {
      await logEntry({
        type: "meal",
        timestamp: Date.now(),
        foods: foodsPayload,
        carbs: round2(totalCarbs),
        dose: round2(mealDoseVal),
        ...(curBGmgdl ? { currentBG: fromInternalDisplay(curBGmgdl) } : {}),
        ...notesPayload,
      });
    } else if (mode === "mealCorrection") {
      await logEntry({
        type: "mealCorrection",
        timestamp: Date.now(),
        foods: foodsPayload,
        carbs: round2(totalCarbs),
        currentBG: fromInternalDisplay(curBGmgdl),
        targetBG: fromInternalDisplay(tgtBGmgdl),
        dose: round2(combinedDose),
        ...notesPayload,
      });
    } else if (mode === "correction") {
      await logEntry({
        type: "correction",
        timestamp: Date.now(),
        currentBG: fromInternalDisplay(curBGmgdl),
        targetBG: fromInternalDisplay(tgtBGmgdl),
        dose: round2(correctionUnits),
        ...notesPayload,
      });
    } else if (mode === "hypo") {
      await logEntry({
        type: "hypo",
        timestamp: Date.now(),
        currentBG: fromInternalDisplay(curBGmgdl),
        targetBG: fromInternalDisplay(tgtBGmgdl),
        carbsNeeded: round2(hypoCarbs),
        ...notesPayload,
      });
    }
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
    if (mode === "meal" || mode === "mealCorrection") setItems([]);
    if (mode === "meal") setCurrentBG("");
    setNotes("");
    router.push("/history");
  }
  /* eslint-enable react-hooks/purity */

  const showFoodBuilder = mode === "meal" || mode === "mealCorrection";
  const showBGInputs = mode === "mealCorrection" || mode === "correction" || mode === "hypo";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {!usesInsulin && (
        <Card style={{ background: "var(--warn-tint)", border: "none", borderRadius: "var(--radius-sm)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--warn)" }}>{T.noInsulinTitle}</div>
          <div style={{ fontSize: 12.5, color: "var(--warn)", marginTop: 2 }}>{T.noInsulinDesc}</div>
        </Card>
      )}

      <SegmentedControl
        value={mode}
        onChange={setMode}
        options={[
          { value: "meal", label: T.mealTab },
          { value: "mealCorrection", label: T.mealCorrTab },
        ]}
      />
      <SegmentedControl
        value={mode}
        onChange={setMode}
        options={[
          { value: "correction", label: T.correctionTab },
          { value: "hypo", label: T.hypoTab },
        ]}
      />

      {showFoodBuilder && (
        <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>{T.mealItemsTitle}</div>
          {items.length === 0 && <div style={{ fontSize: 13, color: "var(--text-3)" }}>{T.noItemsYet}</div>}
          {items.map((it) => (
            <div key={foodKey(it.food)} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{it.food.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                  {it.food.portion} · {T.carbsUnit(it.food.carbs)}
                </div>
              </div>
              <button
                onClick={() => setQty(it.food, it.qty - 1)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <MinusIcon size={14} strokeWidth={2.2} />
              </button>
              <span className="num" style={{ minWidth: 16, textAlign: "center", fontWeight: 700 }}>
                {it.qty}
              </span>
              <button
                onClick={() => setQty(it.food, it.qty + 1)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <PlusIcon size={14} strokeWidth={2.2} />
              </button>
            </div>
          ))}
          <Button variant="secondary" onClick={() => setPickerOpen(true)}>
            {T.addFoodFromList}
          </Button>
          <Button variant="outline" onClick={() => setSuggestOpen(true)}>
            {T.addYourOwnFood}
          </Button>
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: "1px solid var(--border)" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>{T.totalCarbsLabel}</span>
            <span className="num" style={{ fontSize: 15, fontWeight: 800 }}>
              {round2(totalCarbs)}g
            </span>
          </div>
        </Card>
      )}

      <Card style={{ display: "flex", flexDirection: "column" }}>
        <LogRow icon={<DropIcon size={17} />} label={T.currentBGLabel(unit)}>
          <TextInput
            type="number"
            value={currentBG}
            onChange={(e) => setCurrentBG(e.target.value)}
            placeholder={profile.units === "mmol" ? (showBGInputs ? "13.9" : "7.2") : showBGInputs ? "250" : "130"}
          />
          {mode === "meal" && <span style={{ fontSize: 12, color: "var(--text-3)" }}>{T.currentBGOptionalHint}</span>}
        </LogRow>

        {showBGInputs && (
          <LogRow icon={<TargetIcon size={17} />} label={T.targetBGLabel(unit)}>
            <TextInput
              type="number"
              value={targetBG}
              onChange={(e) => setTargetBG(e.target.value)}
              placeholder={profile.units === "mmol" ? "7.2" : "130"}
            />
          </LogRow>
        )}

        <LogRow icon={<NoteIcon size={17} />} label={T.notesLabel} divider={false}>
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={T.notesPlaceholder} maxLength={280} />
        </LogRow>
      </Card>

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
                {T.mealDoseLabel}
              </div>
              <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, color: "white" }}>
                {round2(mealDoseVal)} <span style={{ fontSize: 16 }}>{T.units}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "oklch(100% 0 0 / 0.8)" }}>
                {round2(totalCarbs)}g ÷ {round2(profile.carbRatio!)} g/unit
              </div>
            </>
          )}
          {mode === "mealCorrection" && (
            <>
              <div style={{ fontSize: 12, color: "oklch(100% 0 0 / 0.75)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {T.mealCorrDoseLabel}
              </div>
              <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, color: "white" }}>
                {round2(combinedDose)} <span style={{ fontSize: 16 }}>{T.units}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "oklch(100% 0 0 / 0.8)" }}>
                {T.mealCorrSummary(String(round2(mealDoseVal)), String(round2(correctionUnits)))}
              </div>
            </>
          )}
          {mode === "correction" && (
            <>
              <div style={{ fontSize: 12, color: "oklch(100% 0 0 / 0.75)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {T.correctionDoseLabel}
              </div>
              <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, color: "white" }}>
                {round2(correctionUnits)} <span style={{ fontSize: 16 }}>{T.units}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "oklch(100% 0 0 / 0.8)" }}>
                ({currentBG || 0} − {targetBG || 0}) ÷ {round2(profile.isf!)}
              </div>
            </>
          )}
          {mode === "hypo" && (
            <>
              <div style={{ fontSize: 12, color: "oklch(100% 0 0 / 0.8)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {T.hypoCarbsLabel}
              </div>
              <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, color: "white" }}>
                {round2(hypoCarbs)} <span style={{ fontSize: 16 }}>{T.gCarbs}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "oklch(100% 0 0 / 0.85)" }}>{T.treatLowFirst}</div>
            </>
          )}
          <Button onClick={logResult} style={{ background: "white", color: mode === "hypo" ? "var(--danger)" : "var(--primary-dark)" }}>
            {savedFlash ? T.savedBtn : T.logThisBtn}
          </Button>
        </Card>
      )}

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title={T.addAFoodTitle}>
        <FoodPicker foods={allFoods} onAdd={addItem} />
      </Modal>
      <SuggestFoodModal open={suggestOpen} onClose={() => setSuggestOpen(false)} onSuggest={addCustomFood} />
    </div>
  );
}
