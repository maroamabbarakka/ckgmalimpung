import { WORKFLOW_STEPS } from './workflowSteps';

export default function WorkflowStepper({ activeKey = 'loket' }) {
  const activeIndex = Math.max(0, WORKFLOW_STEPS.findIndex((step) => step.key === activeKey));

  return (
    <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ol className="flex min-w-max items-center gap-2">
        {WORKFLOW_STEPS.map((step, index) => {
          const isActive = index === activeIndex;
          const isDone = index < activeIndex;
          const tone = isActive
            ? 'border-white bg-white text-teal-700 shadow-sm'
            : isDone
              ? 'border-white/20 bg-white/20 text-white'
              : 'border-white/10 bg-white/10 text-white/70';

          return (
            <li key={step.key} className="flex items-center gap-2">
              <div className={`flex min-h-10 min-w-10 flex-col items-center justify-center rounded-2xl border px-3 ${tone}`}>
                <span className="text-xs font-black leading-none">{step.shortLabel}</span>
                <span className="mt-1 text-[8px] font-black uppercase tracking-wider opacity-70">
                  {isActive ? 'Aktif' : isDone ? 'Selesai' : 'Menunggu'}
                </span>
              </div>
              {index < WORKFLOW_STEPS.length - 1 && <span className="h-px w-4 bg-white/25" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
