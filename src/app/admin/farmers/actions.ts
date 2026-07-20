"use server";

import { createClient } from "@/lib/supabase/server";

export async function createFarmer(input: {
  name: string;
  village: string;
  phoneWhatsapp: string;
}): Promise<{ error: string } | { id: string }> {
  const name = input.name.trim();
  const village = input.village.trim();
  const phoneWhatsapp = input.phoneWhatsapp.trim();

  if (!name) {
    return { error: "Name is required." };
  }
  if (!village) {
    return { error: "Village is required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farmers")
    .insert({
      name,
      village,
      phone_whatsapp: phoneWhatsapp || null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { id: data.id };
}
