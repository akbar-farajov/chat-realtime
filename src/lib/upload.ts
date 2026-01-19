import { createClient } from "@/lib/supabase/client";

export async function uploadFile(file: File): Promise<string | null> {
  const supabase = createClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}_${crypto.randomUUID()}.${fileExt}`;
  const filePath = `public/${fileName}`;

  const { error } = await supabase.storage
    .from("attachments")
    .upload(filePath, file);

  if (error) {
    console.error("Upload error:", error.message);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("attachments").getPublicUrl(filePath);

  return publicUrl;
}
