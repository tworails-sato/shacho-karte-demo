import type { UsageSettings } from "@/lib/usage-settings";

export function ResultWatermark({ settings }: { settings: UsageSettings }) {
  if (!settings.watermark_enabled) return null;

  return (
    <div aria-hidden="true" className="result-watermark">
      {settings.watermark_text}
    </div>
  );
}

export function ResultCopyright({ settings }: { settings: UsageSettings }) {
  if (!settings.copyright_enabled) return null;

  return (
    <section className="panel relative z-10 p-4 text-sm font-bold leading-7 text-stone-700">
      <p>{settings.copyright_text}</p>
      <p>本診断の設問・診断結果・画面構成の無断転載、複製、営業利用を禁止します。</p>
    </section>
  );
}
