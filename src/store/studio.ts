import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CarryType, InlayColor, LetteringStyle, ShapeName, Stone, Symbol } from "@/lib/notion/types";
import { availableCarryTypes, availableShapes, availableStones, availableSymbols } from "@/lib/studio/filters";
import { trackStepBack } from "@/lib/analytics";

export type StepId =
  | "where-to-begin"
  | "carry-type"
  | "stone"
  | "shape"
  | "symbol"
  | "inlay"
  | "dedication"
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
  // Price for ONE of this gem. Multiply by `quantity` for the line total —
  // never store a pre-multiplied figure, or changing the quantity would need
  // the original unit price back out of it.
  totalPrice: number;
  // True identical duplicates only (confirmed with Anthony 2026-07-28) —
  // "same design, different person" would need per-copy initials and is
  // explicitly deferred. Optional on the type so carts persisted before this
  // field existed still deserialize; `cartQuantity()` is the safe reader.
  quantity?: number;
};

// Every read of a cart item's quantity goes through here. A cart saved to
// localStorage before quantity existed rehydrates without the field, and a
// bare `g.quantity` would silently poison every total with NaN.
export function cartQuantity(gem: CartGem): number {
  return Math.max(1, Math.floor(gem.quantity ?? 1));
}

export function cartLineTotal(gem: CartGem): number {
  return gem.totalPrice * cartQuantity(gem);
}

export type BeginChoice = "stone" | "shape" | "carry-type" | "symbol";

// Real order, confirmed 2026-07-04 against the old RMG_Deploy_v9e prototype's
// actual shipped step sequence (replaces an earlier placeholder guess that
// was never a real decision — see [[project-rmg-studio-screens]]).
const REMAINING_ORDER: BeginChoice[] = ["carry-type", "shape", "stone", "symbol"];

const ALL_CARRY_TYPES: CarryType[] = ["Wear It", "Carry It", "Hang It"];

// "Dedication" (initials + who the gem honors) deliberately sits at the END,
// immediately before Review — the heaviest emotional question is asked once
// the customer is already invested in the piece they've designed, not cold on
// arrival, and the permanent engraving gets its own screen instead of riding
// along with inlay color. 8 steps total on the normal path.
function computeStepOrder(first: BeginChoice): StepId[] {
  const remaining = REMAINING_ORDER.filter((c) => c !== first);
  return ["where-to-begin", first, ...remaining, "inlay", "dedication", "review"];
}

// Deep-link entry (arriving via "Begin with this stone/symbol/shape" from an
// Explore page) skips both "where-to-begin" and the screen for whatever was
// already chosen, since that choice was already made before the customer
// entered the Studio. 6 steps total.
function computeDeepLinkStepOrder(first: BeginChoice): StepId[] {
  const remaining = REMAINING_ORDER.filter((c) => c !== first);
  return [...remaining, "inlay", "dedication", "review"];
}

// Both path lengths are fixed regardless of which choice the customer starts
// from (one first choice + the other three, either way), so the progress
// denominator can be locked the moment they enter and never recomputed. A
// total that shifts mid-flow reads as the finish line moving, which is
// exactly the opposite of what a progress indicator is for. Derived from the
// functions above rather than hardcoded so the two can't drift apart.
const FULL_STEP_COUNT = computeStepOrder("stone").length;
const DEEP_LINK_STEP_COUNT = computeDeepLinkStepOrder("stone").length;

type StudioState = {
  firstName: string;
  lastName: string;
  birthYear: string;
  deathYear: string;

  beginChoice: BeginChoice | null;
  stepOrder: StepId[];
  currentStep: StepId;
  // Locked when the customer enters (8 normally, 6 via a deep link) and never
  // recalculated while they move through the flow — see the constants above.
  totalSteps: number;
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
  // Explicit "I don't want initials on the back" opt-out. Distinct from an
  // empty `initials` string, which on its own can't tell a deliberate choice
  // apart from a field the customer simply hasn't filled in yet.
  declinedInitials: boolean;

  // Completed gems from earlier in this checkout, plus which step to return
  // to if the persistent cart badge was clicked mid-configuration (null when
  // arriving at "added-to-cart" straight off a fresh "Add to Cart" press).
  cart: CartGem[];
  cartViewReturnStep: StepId | null;
  // Which cart slot the live Studio state was loaded from, so "Add to Cart"
  // overwrites that gem instead of appending a second copy of it. Null during
  // a normal first-time configuration.
  editingCartIndex: number | null;

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
  setDeclinedInitials: (v: boolean) => void;
  goNext: () => void;
  goBack: () => void;
  goToStep: (step: StepId) => void;
  editFromReview: (step: StepId) => void;
  reset: () => void;

  addCurrentGemToCart: (priced: { basePrice: number; addOns: string[]; totalPrice: number }) => void;
  viewCart: () => void;
  startAnotherGem: () => void;
  clearCart: () => void;
  removeFromCart: (index: number) => void;
  setCartQuantity: (index: number, quantity: number) => void;
  editCartItem: (index: number) => void;
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
  | "totalSteps"
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
  | "declinedInitials"
  | "cartViewReturnStep"
  | "editingCartIndex"
> = {
  firstName: "",
  lastName: "",
  birthYear: "",
  deathYear: "",
  beginChoice: null,
  stepOrder: ["where-to-begin"],
  currentStep: "where-to-begin",
  totalSteps: FULL_STEP_COUNT,
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
  declinedInitials: false,
  cartViewReturnStep: null,
  editingCartIndex: null,
};

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      cart: [],

      setInMemoryOf: (v) => set(v),

      setCatalogData: (stones, symbols) => set({ stones, symbols }),

      chooseBeginWith: (choice) =>
        set({
          beginChoice: choice,
          stepOrder: computeStepOrder(choice),
          currentStep: choice,
          totalSteps: FULL_STEP_COUNT,
        }),

      // Explicitly clears every other gem-config field before applying the
      // deep-linked choice — a fresh "Begin with this X" entry must never
      // carry over a stone/shape/symbol/etc. left behind by an earlier,
      // unrelated Studio visit in the same browser tab (real bug: a stray
      // leftover symbol rendered instead of the actual deep-linked stone in
      // the "You've chosen" strip).
      beginFromDeepLink: (choice, value) => {
        const stepOrder = computeDeepLinkStepOrder(choice);
        set({
          stone: null,
          shape: null,
          carryType: null,
          symbol: null,
          inlayColor: null,
          letteringStyle: null,
          initials: "",
          declinedInitials: false,
          ...applySingleOption(choice, value as Stone | ShapeName | CarryType | Symbol),
          beginChoice: choice,
          stepOrder,
          totalSteps: DEEP_LINK_STEP_COUNT,
          // Lands on the first unresolved choice screen. Previously this was
          // always "in-memory-of"; with that screen moved to the end of the
          // flow, the deep-link entry point is now the head of stepOrder.
          currentStep: stepOrder[0],
        });
      },

      setStone: (s) => set({ stone: s }),
      setShape: (s) => set({ shape: s }),
      setCarryType: (c) => set({ carryType: c }),
      setSymbol: (s) => set({ symbol: s }),
      setInlayColor: (c) => set({ inlayColor: c }),
      setLetteringStyle: (l) => set({ letteringStyle: l }),
      setInitials: (v) => set({ initials: v.slice(0, 3).toUpperCase() }),

      // Checking the opt-out clears anything already typed, so a stray leftover
      // character can't reach the engraver after the customer said "no initials".
      setDeclinedInitials: (v) => set(v ? { declinedInitials: true, initials: "" } : { declinedInitials: false }),

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
        const { stepOrder, currentStep, cameFromReview, totalSteps } = get();
        // Recorded alongside the resulting step view so genuine drop-off can
        // be told apart from a customer backtracking to reconsider (#29).
        const backFrom = stepOrder.indexOf(currentStep);
        if (backFrom >= 0) {
          trackStepBack({
            step_name: currentStep,
            step_number: backFrom + 1,
            total_steps: totalSteps,
            entry_type: stepOrder.includes("where-to-begin") ? "fresh" : "deep_link",
          });
        }
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
          // Editing an existing line keeps whatever quantity was already set —
          // the customer changed the design, not how many they wanted.
          quantity: s.editingCartIndex != null ? cartQuantity(s.cart[s.editingCartIndex]) : 1,
        };

        const isEditing = s.editingCartIndex != null && s.cart[s.editingCartIndex] != null;
        const cart = isEditing
          ? s.cart.map((existing, i) => (i === s.editingCartIndex ? gem : existing))
          : [...s.cart, gem];

        set({ cart, currentStep: "added-to-cart", cartViewReturnStep: null, editingCartIndex: null });
      },

      // Jumps to the cart screen from the persistent badge, remembering where
      // to return to via "Continue configuring" (unlike arriving here fresh
      // off "Add to Cart", where there's nothing mid-flight to return to).
      viewCart: () => set({ cartViewReturnStep: get().currentStep, currentStep: "added-to-cart" }),

      // "Add another gem" — restarts at "Where to begin", keeps the cart
      // intact, and resets the gem-specific design fields for a clean second
      // pass. The honoree's name AND initials deliberately survive: a second
      // gem in the same order is usually for the same person, so the
      // dedication screen arrives pre-filled (still editable) rather than
      // making a grieving customer retype it.
      startAnotherGem: () =>
        set({
          beginChoice: null,
          stepOrder: ["where-to-begin"],
          currentStep: "where-to-begin",
          totalSteps: FULL_STEP_COUNT,
          cameFromReview: false,
          stone: null,
          shape: null,
          carryType: null,
          symbol: null,
          inlayColor: null,
          letteringStyle: null,
          cartViewReturnStep: null,
          editingCartIndex: null,
        }),

      clearCart: () => set({ cart: [], editingCartIndex: null }),

      removeFromCart: (index) =>
        set((s) => {
          const cart = s.cart.filter((_, i) => i !== index);
          // Removing a row shifts every later index down by one — an
          // in-progress edit pointing past the removed row would otherwise
          // start overwriting the wrong gem.
          let editingCartIndex = s.editingCartIndex;
          if (editingCartIndex != null) {
            if (editingCartIndex === index) editingCartIndex = null;
            else if (editingCartIndex > index) editingCartIndex -= 1;
          }
          return { cart, editingCartIndex };
        }),

      setCartQuantity: (index, quantity) =>
        set((s) => ({
          cart: s.cart.map((gem, i) => (i === index ? { ...gem, quantity: Math.max(1, Math.floor(quantity)) } : gem)),
        })),

      // Loads a finished cart gem back into the live Studio and drops the
      // customer at Review, where every existing "Change" link already works.
      // `editingCartIndex` is what makes the eventual "Add to Cart" overwrite
      // this slot instead of appending a duplicate.
      editCartItem: (index) => {
        const s = get();
        const gem = s.cart[index];
        if (!gem) return;
        const stepOrder = computeStepOrder(s.beginChoice ?? "stone");
        set({
          firstName: gem.firstName,
          lastName: gem.lastName,
          birthYear: gem.birthYear,
          deathYear: gem.deathYear,
          stone: gem.stone,
          shape: gem.shape,
          carryType: gem.carryType,
          symbol: gem.symbol,
          inlayColor: gem.inlayColor,
          letteringStyle: gem.letteringStyle,
          initials: gem.initials,
          // CartGem doesn't store the opt-out flag, but it's recoverable:
          // the dedication screen only lets a gem through with initials filled
          // OR the "no initials" box checked, so empty initials on a completed
          // gem means it was declined.
          declinedInitials: !gem.initials,
          stepOrder,
          totalSteps: FULL_STEP_COUNT,
          currentStep: "review",
          cameFromReview: false,
          cartViewReturnStep: null,
          editingCartIndex: index,
        });
      },
    }),
    {
      name: "rmg-studio-cart",
      // Only the completed cart survives a refresh/closed tab — the gem
      // currently mid-configuration isn't persisted (accepted tradeoff,
      // see [[project-rmg-multigem-cart]]).
      partialize: (state) => ({ cart: state.cart }),
      // Carts written before quantity existed rehydrate without the field.
      // Backfilling on the way in means nothing downstream has to wonder.
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as { cart?: CartGem[] } | undefined;
        if (!state?.cart) return state as never;
        if (version >= 1) return state as never;
        return { ...state, cart: state.cart.map((g) => ({ ...g, quantity: g.quantity ?? 1 })) } as never;
      },
    }
  )
);
