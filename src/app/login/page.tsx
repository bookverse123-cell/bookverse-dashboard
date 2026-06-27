import { LoginForm } from "@/components/auth/LoginForm";
import { ArchesPattern } from "@/components/auth/ArchesPattern";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-parchment">
      {/* Left panel — brand / motion */}
      <div className="relative hidden w-[58%] flex-col justify-between overflow-hidden bg-ink px-16 py-12 text-parchment lg:flex">
        <div className="grain absolute inset-0" />

        <div className="relative z-10 flex items-center gap-3">
          <img
            src="https://res.cloudinary.com/dm8jtnzdi/image/upload/v1782547833/WhatsApp_Image_2026-06-14_at_11.35.04_1_nm8msy.jpg"
            alt="BOOKVERSE"
            className="h-9 w-9 rounded-lg object-cover"
          />
          <span className="font-display text-lg tracking-wide">
            BOOKVERSE
          </span>
        </div>

        <div className="relative z-10">
          <ArchesPattern />
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl leading-tight">
            Every seat, every member,
            <br /> every rupee — in one place.
          </h2>
          <p className="mt-4 text-sm text-parchment/60">
            Track seat occupancy across the library and premium lounge,
            manage memberships, and watch revenue versus expenses update in
            real time.
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex w-full flex-col items-center justify-center px-8 lg:w-[42%]">
        <LoginForm />
      </div>
    </div>
  );
}
