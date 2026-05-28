export function CurrentCall({ call }) {
  return (
    <section className="rounded-[2rem] bg-teal-600 p-8 text-white">
      <p className="text-2xl font-black uppercase">Nomor Dipanggil</p>
      <h1 className="mt-4 text-8xl font-black">{call?.noAntrian || call?.identitas_layar || '-'}</h1>
      <p className="mt-4 text-4xl font-bold">{call?.posTujuan || call?.pos || '-'}</p>
    </section>
  );
}
