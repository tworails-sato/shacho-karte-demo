import { getEmployeePhaseGuide } from "@/lib/employee-phase";

type EmployeePhaseGuideSectionProps = {
  employeeSize?: string | null;
};

export default function EmployeePhaseGuideSection({ employeeSize }: EmployeePhaseGuideSectionProps) {
  const selectedGuide = getEmployeePhaseGuide(employeeSize);

  return (
    <section className="panel p-5">
      <div className="max-w-3xl">
        <p className="text-sm font-bold text-brand">PHASE GUIDE</p>
        <h2 className="mt-1 text-xl font-black text-ink">あなたの経営フェーズ</h2>
        <p className="mt-2 leading-7 text-stone-600">
          現在の規模では、組織・売上・財務・経営管理のバランスを見直すタイミングです。
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-teal-100 bg-teal-50/70 p-4">
        {selectedGuide ? (
          <p className="text-sm font-black text-teal-700">{selectedGuide.phase}</p>
        ) : null}
        <p className="mt-2 leading-7 text-teal-950">
          今回の診断結果と照らし合わせると、どこに優先課題があるかはフィードバック面談で詳しく整理します。
        </p>
      </div>
    </section>
  );
}
