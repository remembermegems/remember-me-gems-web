import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CarryType, InlayColor, LetteringStyle, ShapeName, Stone, Symbol } from "@/lib/notion/types";
import { availableCarryTypes, availableShapes, availableStones, availableSymbols } from "@/lib/studio/filters";

export type StepId =
  | "in-memory-of"
  | "where-to-begin"
  | "carry-type"
  | "stone"
  | "shape"
  | "symbol"
  | "inlay"
  | "review"
  | "added-to-cart";

// A completed gem, snapshotted into the cart when "Add to Cart" is pressed.
// Pricing is captured at add-time (matches what the customer saw on Review),
// not recomputed live — the server recomputes again at checkout for the
// actual charge, this is only for cart display.
export type CartGem = {
  firstName: string;
  lastName: string;
  birthYear: string;
  deathYear: string;
  stone: Stone;
  shape: ShapeName;
  carryType: CarryType | null;
  symbol: Symbol | null;
  inlayColor: InlayColor;
  letteringStyle: LetteringStyle;
  initials: string;
  basePrice: number;
  addOns: string[];
  totalPrice: number;
};

export type BeginChoice = "stone" | "shape" | "carry-type" | "symbol";

// Real order, confirmed 2026-07-04 against the old RMG_Deploy_v9e prototype's
// actual shipped step sequence (replaces an earlier placeholder guess that
// was never a real decision — see [[project-rmg-studio-screens]]).
const REMAINING_ORDER: BeginChoice[] = ["carry-type", "shape", "stone", "symbol"];

const ALL_CARRY_TYPES: CarryType[] = ["Wear It", "Carry It", "Hang It"];

function computeStepOrder(first: BeginChoice): StepId[] {
  const remaining = REMAINING_ORDER.filter((c) => c !== first);
  return ["in-memory-of", "where-to-begin", first, ...remaining, "inlay", "review"];
}

// Deep-link entry (arriving via "Begin with this stone/symbol/shape" from an
// Explore page) skips both "where-to-begin" and the screen for whatever was
// already chosen, since that choice was already made before the customer
// entered the Studio.
function computeDeepLinkStepOrder(first: BeginChoice): StepId[] {
  const remaining = REMAINING_ORDER.filter((c) => c !== first);
  return ["in-memory-of", ...remaining, "inlay", "review"];
}

type StudioState = {
  firstName: string;
  lastName: string;
  birthYear: string;
  deathYear: string;

  beginChoice: BeginChoice | null;
  stepOrder: StepId[];
  currentStep: StepId;
  cameFromReview: boolean;

  stones: Stone[];
  symbols: Symbol[];

  stone: Stone | null;
  shape: ShapeName | null;
  carryType: CarryType | null;
  symbol: Symbol | null;
  inlayColor: InlayColor | null;
  letteringStyle: LetteringStyle | null;
  initials: string;

  // Completed gems from earlier in this checkout, plus which step to return
  // to if the persistent cart badge was clicked mid-configuration (null when
  // arriving at "added-to-cart" straight off a fresh "Add to Cart" press).
  cart: CartGem[];
  cartViewReturnStep: StepId | null;

  setInMemoryOf: (v: { firstName: string; lastName: string; birthYear: string; deathYear: string }) => void;
  setCatalogData: (stones: Stone[], symbols: Symbol[]) => void;
  chooseBeginWith: (choice: BeginChoice) => void;
  beginFromDeepLink: (choice: BeginChoice, value: Stone | ShapeName | Symbol) => void;
  setStone: (s: Stone | null) => void;
  setShape: (s: ShapeName | null) => void;
  setCarryType: (c: CarryType | null) => void;
  setSymbol: (s: Symbol | null) => void;
  setInlayColor: (c: InlayColor | null) => void;
  setLetteringStyle: (l: LetteringStyle | null) => void;
  setInitials: (v: string) => void;
  goNext: () => void;
  goBack: () => void;
  goToStep: (step: StepId) => void;
  editFromReview: (step: StepId) => void;
  reset: () => void;

  addCurrentGemToCart: (priced: { basePrice: number; addOns: string[]; totalPrice: number }) => void;
  viewCart: () => void;
  startAnotherGem: () => void;
  clearCart: () => void;
};

// "Never show a customer a choice they don't have" — if a step's available
// options (via the cross-filtering engine in lib/studio/filters.ts) narrow
// to exactly one, return that sole value so the caller can auto-apply it and
// skip the screen, instead of asking a question with only one answer.
function singleOption(step: StepId, s: StudioState): Stone | ShapeName | CarryType | Symbol | null {
  switch (step) {
    case "carry-type": {
      const options = availableCarryTypes(ALL_CARRY_TYPES, { stone: s.stone, symbol: s.symbol, shape: s.shape });
      return options.length === 1 ? options[0] : null;
    }
    case "shape": {
      const options = availableShapes({ stone: s.stone, symbol: s.symbol, carryType: s.carryType });
      return options.length === 1 ? options[0] : null;
    }
    case "stone": {
      const options = availableStones(s.stones, s.shape);
      return options.length === 1 ? options[0] : null;
    }
    case "symbol": {
      const options = availableSymbols(s.symbols, s.shape);
      return options.length === 1 ? options[0] : null;
    }
    default:
      return null;
  }
}

function applySingleOption(step: StepId, value: Stone | ShapeName | CarryType | Symbol): Partial<StudioState> {
  switch (step) {
    case "carry-type":
      return { carryType: value as CarryType };
    case "shape":
      return { shape: value as ShapeName };
    case "stone":
      return { stone: value as Stone };
    case "symbol":
      return { symbol: value as Symbol };
    default:
      return {};
  }
}

const INITIAL: Pick<
  StudioState,
  | "firstName"
  | "lastName"
  | "birthYear"
  | "deathYear"
  | "beginChoice"
  | "stepOrder"
  | "currentStep"
  | "cameFromReview"
  | "stones"
  | "symbols"
  | "stone"
  | "shape"
  | "carryType"
  | "symbol"
  | "inlayColor"
  | "letteringStyle"
  | "initials"
  | "cartViewReturnStep"
> = {
  firstName: "",
  lastName: "",
  birthYear: "",
  deathYear: "",
  beginChoice: null,
  stepOrder: ["in-memory-of", "where-to-begin"],
  currentStep: "in-memory-of",
  cameFromReview: false,
  stones: [],
  symbols: [],
  stone: null,
  shape: null,
  carryType: null,
  symbol: null,
  inlayColor: null,
  letteringStyle: null,
  initials: "",
  cartViewReturnStep: null,
};

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      cart: [],

      setInMemoryOf: (v) => set(v),

      setCatalogData: (stones, symbols) => set({ stones, symbols }),

      chooseBeginWith: (choice) =>
        set({ beginChoice: choice, stepOrder: computeStepOrder(choice), currentStep: choice }),

      // Explicitly clears every other gem-config field before applying the
      // deep-linked choice — a fresh "Begin with this X" entry must never
      // carry over a stone/shape/symbol/etc. left behind by an earlier,
      // unrelated Studio visit in the same browser tab (real bug: a stray
      // leftover symbol rendered instead of the actual deep-linked stone in
      // the "You've chosen" strip).
      beginFromDeepLink: (choice, value) =>
        set({
          stone: null,
          shape: null,
          carryType: null,
          symbol: null,
          inlayColor: null,
          letteringStyle: null,
          initials: "",
          ...applySingleOption(choice, value as Stone | ShapeName | CarryType | Symbol),
          beginChoice: choice,
          stepOrder: computeDeepLinkStepOrder(choice),
          currentStep: "in-memory-of",
        }),

      setStone: (s) => set({ stone: s }),
      setShape: (s) => set({ shape: s }),
      setCarryType: (c) => set({ carryType: c }),
      setSymbol: (s) => set({ symbol: s }),
      setInlayColor: (c) => set({ inlayColor: c }),
      setLetteringStyle: (l) => set({ letteringStyle: l }),
      setInitials: (v) => set({ initials: v.slice(0, 3).toUpperCase() }),

      goNext: () => {
        const { stepOrder, currentStep, cameFromReview } = get();
        if (cameFromReview) {
          set({ currentStep: "review", cameFromReview: false });
          return;
        }
        let idx = stepOrder.indexOf(currentStep);
        while (idx >= 0 && idx < stepOrder.length - 1) {
          const nextStep = stepOrder[idx + 1];
          const resolved = singleOption(nextStep, get());
          if (!resolved) {
            set({ currentStep: nextStep });
            return;
          }
          set(applySingleOption(nextStep, resolved));
          idx += 1;
        }
      },

      goBack: () => {
        const { stepOrder, currentStep, cameFromReview } = get();
        if (cameFromReview) {
          set({ currentStep: "review", cameFromReview: false });
          return;
        }
        let idx = stepOrder.indexOf(currentStep);
        while (idx > 0) {
          const prevStep = stepOrder[idx - 1];
          if (!singleOption(prevStep, get())) {
            set({ currentStep: prevStep });
            return;
          }
          idx -= 1;
        }
      },

      goToStep: (step) => set({ currentStep: step }),

      // Used by the Review screen's "change" links — jumps to the target step,
      // and makes the next Back/Continue press on that screen return here
      // instead of continuing through the rest of the flow.
      editFromReview: (step) => set({ currentStep: step, cameFromReview: true }),

      reset: () => set({ ...INITIAL, cart: [] }),

      // Snapshots the gem currently being configured into the cart (pricing
      // passed in since only the caller — Review — has betaMode in scope),
      // then swaps to the acknowledgment screen. This is a client-side-only
      // state change, no network call — checkout happens later, on demand.
      addCurrentGemToCart: (priced) => {
        const s = get();
        if (!s.stone || !s.shape) return;
        const gem: CartGem = {
          firstName: s.firstName,
          lastName: s.lastName,
          birthYear: s.birthYear,
          deathYear: s.deathYear,
          stone: s.stone,
          shape: s.shape,
          carryType: s.carryType,
          symbol: s.symbol,
          inlayColor: s.inlayColor ?? "Natural",
          letteringStyle: s.letteringStyle ?? "Monument",
          initials: s.initials,
          basePrice: priced.basePrice,
          addOns: priced.addOns,
          totalPrice: priced.totalPrice,
        };
        set({ cart: [...s.cart, gem], currentStep: "added-to-cart", cartViewReturnStep: null });
      },

      // Jumps to the cart screen from the persistent badge, remembering where
      // to return to via "Continue configuring" (unlike arriving here fresh
      // off "Add to Cart", where there's nothing mid-flight to return to).
      viewCart: () => set({ cartViewReturnStep: get().currentStep, currentStep: "added-to-cart" }),

      // "Add another gem" — re-shows "In Memory Of" pre-filled with the
      // previous honoree (editable, not cleared), keeps the cart intact, and
      // resets every other gem-specific field for a clean second pass.
      startAnotherGem: () =>
        set({
          beginChoice: null,
          stepOrder: ["in-memory-of", "where-to-begin"],
          currentStep: "in-memory-of",
          cameFromReview: false,
          stone: null,
          shape: null,
          carryType: null,
          symbol: null,
          inlayColor: null,
          letteringStyle: null,
          initials: "",
          cartViewReturnStep: null,
        }),

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "rmg-studio-cart",
      // Only the completed cart survives a refresh/closed tab — the gem
      // currently mid-configuration isn't persisted (accepted tradeoff,
      // see [[project-rmg-multigem-cart]]).
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
