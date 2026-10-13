import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPublicPage } from "@/lib/data/public-page";
import { ShowcaseView } from "@/components/showcase/ShowcaseView";

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

  return {
    title: `${data.profile.display_name} — UdaLink`,
    description: data.profile.bio || `Etalase produk affiliate rekomendasi dari ${data.profile.display_name}.`,
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
