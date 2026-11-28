"use client";

import React from "react";
import { useParams } from "next/navigation";
import { SuratKeluarEditor } from "@/components/surat/SuratKeluarEditor";

export default function EditSuratKeluarPage() {
  const params = useParams();
  const id = params?.id as string;

  return <SuratKeluarEditor mode="edit" initialSuratId={id} />;
}
