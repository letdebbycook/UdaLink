"use client";

import { ShieldOff, LogOut, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AkunDinonaktifkanPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/masuk");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center">
            <ShieldOff className="h-10 w-10 text-red-500" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Akun Dinonaktifkan
          </h1>
          <p className="text-sm text-[#64748B] leading-relaxed">
            Akunmu telah dinonaktifkan oleh admin. Etalase afiliasemu tidak
            dapat diakses untuk sementara waktu.
          </p>
          <p className="text-sm text-[#64748B]">
            Jika kamu merasa ini adalah kesalahan atau ingin mengajukan banding,
            silakan hubungi tim UdaLink.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="https://wa.me/628123456789?text=Halo%20Admin%20UdaLink%2C%20akun%20saya%20dinonaktifkan.%20Mohon%20bantuannya."
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full h-11 gap-2 text-sm font-semibold bg-green-600 hover:bg-green-700">
              <MessageCircle className="h-4 w-4" />
              Hubungi Admin via WhatsApp
            </Button>
          </Link>

          <Button
            variant="outline"
            className="w-full h-11 gap-2 text-sm font-medium text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Keluar dari Akun
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-[#94A3B8]">
          UdaLink berhak menonaktifkan akun yang melanggar{" "}
          <Link href="/syarat" className="underline hover:text-[#64748B]">
            Syarat &amp; Ketentuan
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
