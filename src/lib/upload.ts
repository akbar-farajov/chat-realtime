import { createClient } from "@/lib/supabase/client";

const SIGNED_URL_TTL = 60 * 60;

export interface UploadResult {
  filePath: string;
  signedUrl: string;
}

export async function uploadFile(
  file: File,
  conversationId: string,
): Promise<UploadResult | null> {
  if (!conversationId) return null;

  const supabase = createClient();

  const fileExt = file.name.split(".").pop() ?? "bin";
  const fileName = `${Date.now()}_${crypto.randomUUID()}.${fileExt}`;
  const filePath = `conversations/${conversationId}/${fileName}`;

  const { error } = await supabase.storage.from("attachments").upload(
    filePath,
    file,
    {
      metadata: { conversation_id: conversationId },
    },
  );

  if (error) {
    console.error("Upload error:", error.message);
    return null;
  }

  const { data, error: signedError } = await supabase.storage
    .from("attachments")
    .createSignedUrl(filePath, SIGNED_URL_TTL);

  if (signedError || !data?.signedUrl) {
    console.error("Signed URL error:", signedError?.message);
    return null;
  }

  return { filePath, signedUrl: data.signedUrl };
}
