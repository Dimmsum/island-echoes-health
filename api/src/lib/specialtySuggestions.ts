/**
 * Rule-based specialty inference from a patient's record.
 *
 * Deliberately pure and dependency-free: it takes already-fetched data and returns
 * suggestions, with no Supabase access and no network calls. That makes it cheap to
 * test and keeps one clean seam — if this is ever replaced by an LLM, only the body
 * of `suggestSpecialties` changes, not its callers.
 *
 * Every suggestion carries the evidence that produced it, so the UI can always say
 * *why* a specialty is being recommended rather than presenting it as a black box.
 */

export type SuggestionInput = {
  conditions: { label: string; type: "condition" | "allergy" }[];
  medications: { name: string; endedAt: string | null }[];
  labs: {
    testName: string;
    value: number;
    referenceLow: number | null;
    referenceHigh: number | null;
  }[];
  dateOfBirth: string | null;
};

export type SuggestedSpecialty = {
  id: string;
  /** Human label for the chip, e.g. "Endocrinologist". */
  label: string;
  /** What actually gets sent to Places as the text query. */
  query: string;
  /** Evidence, e.g. ["Type 2 Diabetes", "Metformin"]. Empty for baseline entries. */
  reasons: string[];
  /** Lower sorts first. */
  priority: number;
};

type Rule = {
  id: string;
  label: string;
  query: string;
  priority: number;
  conditionPatterns?: RegExp[];
  medicationPatterns?: RegExp[];
  /** Fires on an out-of-reference-range result for a matching test. */
  labPatterns?: RegExp[];
};

/**
 * Matching is case-insensitive against free text: `patient_conditions.label`,
 * `medications.name` and `lab_results.test_name` are all free-text columns, not
 * enums, so there is no controlled vocabulary to key off.
 *
 * Note on obstetrics/gynaecology: the schema has no sex or gender column, so this
 * can only ever be inferred from an explicit pregnancy-related entry — never from
 * demographics. That omission is intentional, not an oversight.
 */
const RULES: Rule[] = [
  {
    id: "endocrinologist",
    label: "Endocrinologist",
    query: "endocrinologist",
    priority: 10,
    conditionPatterns: [/diabet/i, /thyroid/i, /hypothyroid/i, /hyperthyroid/i],
    medicationPatterns: [/metformin/i, /insulin/i, /levothyroxine/i, /glipizide/i],
    labPatterns: [/a1c/i, /hba1c/i, /glucose/i, /\btsh\b/i],
  },
  {
    id: "cardiologist",
    label: "Cardiologist",
    query: "cardiologist",
    priority: 10,
    conditionPatterns: [/hypertens/i, /high blood pressure/i, /heart failure/i, /arrhythmi/i, /atrial fibrillation/i, /cholesterol/i],
    medicationPatterns: [/statin/i, /atorvastatin/i, /lisinopril/i, /amlodipine/i, /metoprolol/i, /losartan/i],
    labPatterns: [/\bldl\b/i, /\bhdl\b/i, /triglyceride/i, /cholesterol/i],
  },
  {
    id: "pulmonologist",
    label: "Pulmonologist",
    query: "pulmonologist",
    priority: 10,
    conditionPatterns: [/asthma/i, /\bcopd\b/i, /emphysema/i, /bronchiti/i, /sleep apnea/i],
    medicationPatterns: [/inhaler/i, /salbutamol/i, /albuterol/i, /fluticasone/i, /montelukast/i],
  },
  {
    id: "allergist",
    label: "Allergist",
    query: "allergist immunologist",
    priority: 15,
    // Also fires on any row with type "allergy" — handled separately below.
    conditionPatterns: [/allerg/i, /anaphyla/i, /hay fever/i],
    medicationPatterns: [/epinephrine/i, /epipen/i, /cetirizine/i, /loratadine/i],
  },
  {
    id: "obgyn",
    label: "OB-GYN",
    query: "obstetrician gynecologist",
    priority: 10,
    conditionPatterns: [/pregnan/i, /prenatal/i, /postpartum/i, /gestational/i, /endometrio/i, /menopaus/i],
    medicationPatterns: [/prenatal vitamin/i],
  },
  {
    id: "psychiatrist",
    label: "Psychiatrist",
    query: "psychiatrist",
    priority: 15,
    conditionPatterns: [/depress/i, /anxiet/i, /bipolar/i, /\bptsd\b/i, /schizophren/i],
    medicationPatterns: [/sertraline/i, /fluoxetine/i, /escitalopram/i, /citalopram/i, /bupropion/i],
  },
  {
    id: "rheumatologist",
    label: "Rheumatologist",
    query: "rheumatologist",
    priority: 20,
    conditionPatterns: [/arthriti/i, /lupus/i, /fibromyalgi/i, /\bgout\b/i],
    medicationPatterns: [/methotrexate/i, /hydroxychloroquine/i, /allopurinol/i],
  },
  {
    id: "dermatologist",
    label: "Dermatologist",
    query: "dermatologist",
    priority: 20,
    conditionPatterns: [/eczema/i, /psoriasi/i, /dermatiti/i, /\bacne\b/i],
  },
  {
    id: "nephrologist",
    label: "Nephrologist",
    query: "nephrologist",
    priority: 15,
    conditionPatterns: [/kidney/i, /renal/i, /nephro/i, /dialysis/i],
    labPatterns: [/creatinine/i, /\begfr\b/i, /\bbun\b/i],
  },
  {
    id: "neurologist",
    label: "Neurologist",
    query: "neurologist",
    priority: 15,
    conditionPatterns: [/seizure/i, /epilep/i, /migraine/i, /parkinson/i, /multiple sclerosis/i, /stroke/i],
    medicationPatterns: [/levetiracetam/i, /sumatriptan/i, /carbamazepine/i],
  },
  {
    id: "ophthalmologist",
    label: "Ophthalmologist",
    query: "ophthalmologist",
    priority: 20,
    // Diabetes also lands here: annual retinal screening is standard of care.
    conditionPatterns: [/glaucoma/i, /cataract/i, /retinopath/i, /macular/i, /diabet/i],
  },
  {
    id: "gastroenterologist",
    label: "Gastroenterologist",
    query: "gastroenterologist",
    priority: 20,
    conditionPatterns: [/crohn/i, /colitis/i, /\bibs\b/i, /reflux/i, /\bgerd\b/i, /ulcer/i, /hepatiti/i],
    medicationPatterns: [/omeprazole/i, /pantoprazole/i],
  },
  {
    id: "oncologist",
    label: "Oncologist",
    query: "oncologist",
    priority: 5,
    conditionPatterns: [/cancer/i, /carcinom/i, /lymphom/i, /leukemi/i, /tumou?r/i],
  },
  {
    id: "dentist",
    label: "Dentist",
    query: "dentist",
    priority: 25,
    conditionPatterns: [/dental/i, /tooth/i, /teeth/i, /gingiviti/i, /periodont/i],
  },
];

/** Baselines so a patient with an empty record still gets a usable page. */
const BASELINE: SuggestedSpecialty[] = [
  { id: "general-practitioner", label: "General practitioner", query: "general practitioner doctor", reasons: [], priority: 90 },
  { id: "pharmacy", label: "Pharmacy", query: "pharmacy", reasons: [], priority: 95 },
];

function ageFrom(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDelta = now.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

/** A lab only counts as evidence when it is outside a reference range we actually have. */
function isOutOfRange(lab: SuggestionInput["labs"][number]): boolean {
  if (lab.referenceHigh !== null && lab.value > lab.referenceHigh) return true;
  if (lab.referenceLow !== null && lab.value < lab.referenceLow) return true;
  return false;
}

export function suggestSpecialties(input: SuggestionInput): SuggestedSpecialty[] {
  const activeMeds = input.medications.filter((m) => m.endedAt === null);
  const abnormalLabs = input.labs.filter(isOutOfRange);
  const byId = new Map<string, SuggestedSpecialty>();

  const add = (
    parts: { id: string; label: string; query: string; priority: number },
    reason: string,
  ) => {
    const existing = byId.get(parts.id);
    if (existing) {
      if (reason && !existing.reasons.includes(reason)) existing.reasons.push(reason);
      return;
    }
    // Pick explicitly rather than spreading: callers pass whole Rule objects, and
    // spreading would leak the match patterns into the API response.
    const { id, label, query, priority } = parts;
    byId.set(id, { id, label, query, priority, reasons: reason ? [reason] : [] });
  };

  for (const rule of RULES) {
    const { conditionPatterns = [], medicationPatterns = [], labPatterns = [] } = rule;

    for (const c of input.conditions) {
      if (conditionPatterns.some((p) => p.test(c.label))) add(rule, c.label);
    }
    for (const m of activeMeds) {
      if (medicationPatterns.some((p) => p.test(m.name))) add(rule, m.name);
    }
    for (const l of abnormalLabs) {
      if (labPatterns.some((p) => p.test(l.testName))) add(rule, `${l.testName} out of range`);
    }
  }

  // Any recorded allergy warrants an allergist, whatever the free-text label says.
  const allergyRule = RULES.find((r) => r.id === "allergist");
  if (allergyRule) {
    for (const c of input.conditions) {
      if (c.type === "allergy") add(allergyRule, c.label);
    }
  }

  const age = ageFrom(input.dateOfBirth);
  if (age !== null && age < 18) {
    add({ id: "pediatrician", label: "Pediatrician", query: "pediatrician", priority: 1 }, `Age ${age}`);
  }
  if (age !== null && age >= 65) {
    add({ id: "geriatrician", label: "Geriatrician", query: "geriatrician", priority: 5 }, `Age ${age}`);
  }

  for (const b of BASELINE) {
    if (!byId.has(b.id)) byId.set(b.id, { ...b, reasons: [...b.reasons] });
  }

  return [...byId.values()].sort(
    (a, b) => a.priority - b.priority || b.reasons.length - a.reasons.length || a.label.localeCompare(b.label),
  );
}
