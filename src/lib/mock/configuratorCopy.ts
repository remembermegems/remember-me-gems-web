import type { ConfiguratorCopyRow } from "@/lib/notion/types";

// Dev-only fallback, used when NOTION_TOKEN isn't set. Mirrors the locked
// copy decisions from the Studio screen design sessions; the real editable
// source of truth is the "RMG Configurator Copy" Notion database.
function row(key: string, step: ConfiguratorCopyRow["step"], text: string, channel: ConfiguratorCopyRow["channel"] = "Both"): ConfiguratorCopyRow {
  return { id: key, key, step, type: "", text, channel, notes: "", imageUrl: null };
}

export const mockConfiguratorCopy: ConfiguratorCopyRow[] = [
  row("global_beta_mode", "Global", "true"),
  row("global_beta_banner", "Global", "Beta pricing — $100 off every gem while we refine the process."),
  row("global_next_btn", "Global", "Continue"),
  row("global_back_btn", "Global", "Back"),
  row("global_reassurance_note", "Global", "You can review and change your choices at anytime."),

  row("inmemoryof_headline", "In Memory Of", "Tell us about the person you're honoring"),
  row("inmemoryof_subhead", "In Memory Of", "We'll keep their name close throughout this journey."),

  row("wheretobegin_headline", "Form Factor", "Where would you like to begin?"),
  row("stone_tile_desc", "Form Factor", "Start with the stone that speaks to you"),
  row("shape_tile_desc", "Form Factor", "Choose the shape that feels right"),
  row("carry_tile_desc", "Form Factor", "Decide how you'll keep them close"),
  row("symbol_tile_desc", "Form Factor", "Start with a symbol that means something"),

  row("carry_headline", "Form Factor", "How will you carry them?"),

  row("stone_headline", "Stone", "Choose their gemstone"),
  row("stone_intro", "Stone", "Each stone formed over millions of years, and no two are ever alike. Choose the one that feels like them."),
  row("stone_search_placeholder", "Stone", "Search available gemstones…"),
  row("stone_special_request", "Stone", "Not seeing what you're looking for? Make a special request", "Web"),

  row("shape_headline", "Shape", "Choose their shape"),
  row("shape_variation_note", "Shape", "Every gem is shaped by hand from these templates, so finished sizes are approximate — no two are ever exactly alike."),
  row("shape_special_request", "Shape", "Not seeing what you're looking for? Make a special request", "Web"),

  row("symbol_headline", "Symbol", "Choose their symbol"),
  row("symbol_special_request", "Symbol", "Not seeing a symbol that fits? Make a special request", "Web"),

  row("inlay_headline_template", "Inlay Color", "{firstName}'s Remember Me Gem"),
  row("inlay_note", "Inlay Color", "We'll engrave their initials on the back."),
  row("inlay_special_request", "Inlay Color", "Need more than 3 characters? Make a special request", "Web"),
  row("inlay_continue_btn", "Inlay Color", "Review Your Gem"),

  row("review_label_gemstone", "Review", "Gemstone"),
  row("review_label_shape", "Review", "Shape"),
  row("review_label_carry", "Review", "How you'll keep it close"),
  row("review_label_symbol", "Review", "Symbol"),
  row("review_label_inlay", "Review", "Inlay color"),
  row("review_label_lettering", "Review", "Lettering style"),
  row("review_label_initials", "Review", "Initials"),
  row("review_change_link", "Review", "Change"),

  row("review_headline", "Review", "Review Your Gem"),
  row("review_btn", "Review", "Add to Cart"),
  row("review_dedication_template", "Review", "In memory of {fullName}{years}"),
  // Ash-kit reassurance, Web only — the Event deploy takes ash in person, so
  // there's no kit to mail and this block shouldn't render there.
  row("review_next_steps_headline", "Review", "What happens next", "Web"),
  row(
    "review_next_steps_body",
    "Review",
    "After you check out, we'll mail you an ash collection kit. You'll only need about a tablespoon of your loved one's ashes, and the kit includes full step-by-step directions for everything.",
    "Web"
  ),
];
