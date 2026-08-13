import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.25),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.15),transparent_45%)]" />
      <Outlet />
    </div>
  );
}
