import { safiLogoUrl } from "@/assets";

export function LoginBrand() {
  return (
    <div className="mb-6 flex justify-center border-b border-line-soft pb-5">
      <img
        src={safiLogoUrl}
        alt="Safi Ticketing System"
        className="h-auto w-full max-w-[280px] object-contain"
      />
    </div>
  );
}
