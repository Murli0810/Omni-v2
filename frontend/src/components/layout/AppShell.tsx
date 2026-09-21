import { ReactNode } from "react";
import Navbar from "./Navbar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-3 mb-24 mt-4 sm:mx-4 sm:mb-6 lg:mx-6">{children}</main>
    </div>
  );
}
