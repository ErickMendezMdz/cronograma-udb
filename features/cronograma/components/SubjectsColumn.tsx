type SubjectsColumnProps = {
  code: string;
};

export function SubjectsColumn({ code }: SubjectsColumnProps) {
  return (
    <div className="sticky left-0 z-10 h-full border-b border-r border-slate-700 bg-slate-900 px-3 py-4 font-semibold">
      {code}
    </div>
  );
}
