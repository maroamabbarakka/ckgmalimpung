export function PosStatusGrid({ grid = {} }) {
  return (
    <section className="grid grid-cols-7 gap-3">
      {Array.from({ length: 7 }, (_, index) => {
        const key = `pos${index + 1}`;
        return (
          <div key={key} className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-xs font-black uppercase text-slate-500">Pos {index + 1}</p>
            <p className="mt-2 text-4xl font-black text-teal-700">{grid[key]?.length || 0}</p>
          </div>
        );
      })}
    </section>
  );
}
