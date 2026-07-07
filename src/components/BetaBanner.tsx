// Site-wide strip above the nav, shown only while global_beta_mode is on.
// Text comes from the "global_beta_banner" row in the RMG Configurator Copy
// database so Anthony can edit or retire it from Notion without a redeploy.
export function BetaBanner({ show, text }: { show: boolean; text: string }) {
  if (!show || !text) return null;

  return (
    <div className="bg-gold text-warm-white text-center text-sm font-body py-2 px-4">
      {text}
    </div>
  );
}
