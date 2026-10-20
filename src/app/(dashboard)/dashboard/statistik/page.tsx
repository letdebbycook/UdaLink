import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import StatistikView from "./statistik-view";

/**
 * Halaman Statistik khusus pengguna Pro.
 * Status Pro diverifikasi di sisi server lewat RPC is_pro (sumber: memberships);
 * pengguna Free diarahkan ke halaman Langganan untuk upgrade.
 */
export default async function StatistikPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belum terautentikasi: proxy seharusnya sudah mencegat, ini lapisan kedua
  if (!user) {
    redirect("/masuk?redirect=/dashboard/statistik");
  }

  const { data: isPro } = await supabase.rpc("is_pro", { uid: user.id });

  if (!isPro) {
    redirect("/dashboard/langganan?upgrade=statistik");
  }

  return <StatistikView />;
}
