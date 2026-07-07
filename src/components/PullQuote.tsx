import { HeartInfinityIcon } from "./HeartInfinityIcon";

export function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[600px] mx-auto my-12 rounded-2xl bg-dusty-sky/20 px-8 py-10 text-center">
      <HeartInfinityIcon className="mx-auto mb-4 h-5 w-8" color="#7FA7D8" />
      <p className="font-heading italic text-xl text-cocoa">{children}</p>
    </div>
  );
}
