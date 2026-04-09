import Navbar from "@/components/Navbar";
import { HealthCheckProvider } from "@/components/HealthCheckProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <HealthCheckProvider>
      <Navbar />
      <main>{children}</main>
    </HealthCheckProvider>
  );
}
