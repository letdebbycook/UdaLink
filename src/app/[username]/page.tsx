import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPublicPage } from "@/lib/data/public-page";
import { ShowcaseView } from "@/components/showcase/ShowcaseView";

// Cache showcase page with Incremental Static Regeneration (ISR 60 detik)
// Mengurangi beban database dan mempercepat respons loading bagi pengunjung
export const revalidate = 60;

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const data = await getPublicPage(username);

  if (!data) {
    return {
      title: "Halaman Tidak Ditemukan — UdaLink",
    };
  }

  const title = `${data.profile.display_name} (@${data.profile.username}) — UdaLink`;
  const description =
    data.profile.bio ||
    `Lihat etalase produk affiliate rekomendasi dari ${data.profile.display_name}. Cari nomor produk dan langsung belanja di marketplace resmi.`;
  const avatarUrl = data.profile.avatar_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      locale: "id_ID",
      siteName: "UdaLink",
      ...(avatarUrl
        ? {
            images: [
              {
                url: avatarUrl,
                width: 400,
                height: 400,
                alt: data.profile.display_name,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
      ...(avatarUrl ? { images: [avatarUrl] } : {}),
    },
  };
}

export default async function PublicShowcasePage({ params }: PageProps) {
  const { username } = await params;
  const data = await getPublicPage(username);

  if (!data) {
    notFound();
  }

  return <ShowcaseView initialData={data} />;
}
