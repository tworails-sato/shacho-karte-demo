import { employeePhaseGuides, getEmployeePhaseGuide } from "@/lib/employee-phase";

type EmployeePhaseGuideSectionProps = {
  employeeSize?: string | null;
};

const guideItems = [
  { key: "business", label: "事業・売上" },
  { key: "organization", label: "組織・人材" },
  { key: "finance", label: "財務・資金" },
  { key: "management", label: "経営管理・仕組み" }
] as const;

export default function EmployeePhaseGuideSection({ employeeSize }: EmployeePhaseGuideSectionProps) {
  const selectedGuide = getEmployeePhaseGuide(employeeSize) ?? employeePhaseGuides[0];
  const hasSelectedSize = Boolean(getEmployeePhaseGuide(employeeSize));

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-stone-200 p-5">
        <p className="text-sm font-bold text-brand">PHASE GUIDE</p>
        <h2 className="mt-1 text-xl font-black text-ink">従業員規模別 経営フェーズガイド</h2>
        <p className="mt-2 leading-7 text-stone-600">
          企業の課題は、従業員規模によって変わります。今回の結果は、現在の経営フェーズで特に見直したい論点と照らし合わせて確認してください。
        </p>
      </div>

      <div className="space-y-4 p-5">
        {!hasSelectedSize ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-7 text-amber-900">
            従業員規模が未選択のため、参考として「1〜5名」のフェーズを表示しています。
          </p>
        ) : null}

        <div className="rounded-lg border border-teal-100 bg-teal-50/70 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black text-teal-700">{selectedGuide.employeeSize}</p>
              <h3 className="mt-1 text-2xl font-black text-teal-950">{selectedGuide.phase}</h3>
            </div>
            <p className="text-sm font-bold text-teal-800">現在の入力情報に基づく目安</p>
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {guideItems.map((item) => (
              <div key={item.key} className="rounded-md bg-white p-3">
                <dt className="text-xs font-black text-stone-500">{item.label}</dt>
                <dd className="mt-1 font-black text-ink">{selectedGuide[item.key]}</dd>
              </div>
            ))}
          </dl>
        </div>

        <details className="rounded-lg border border-stone-200 bg-white">
          <summary className="cursor-pointer list-none p-4 text-sm font-black text-stone-800 transition hover:bg-stone-50">
            他の規模も見る
          </summary>
          <div className="border-t border-stone-200 p-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-stone-50 text-stone-600">
                  <tr>
                    <th className="px-3 py-3">従業員規模</th>
                    <th className="px-3 py-3">フェーズ</th>
                    <th className="px-3 py-3">事業・売上</th>
                    <th className="px-3 py-3">組織・人材</th>
                    <th className="px-3 py-3">財務・資金</th>
                    <th className="px-3 py-3">経営管理・仕組み</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {employeePhaseGuides.map((guide) => (
                    <tr key={guide.employeeSize} className={guide.employeeSize === selectedGuide.employeeSize ? "bg-teal-50/50" : ""}>
                      <td className="px-3 py-3 font-black text-ink">{guide.employeeSize}</td>
                      <td className="px-3 py-3 font-bold">{guide.phase}</td>
                      <td className="px-3 py-3">{guide.business}</td>
                      <td className="px-3 py-3">{guide.organization}</td>
                      <td className="px-3 py-3">{guide.finance}</td>
                      <td className="px-3 py-3">{guide.management}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}
