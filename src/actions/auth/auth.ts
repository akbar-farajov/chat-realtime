"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const repeatPassword = formData.get("repeatPassword") as string;

  if (password !== repeatPassword) {
    return redirect("/sign-up?message=Passwords do not match&error=true");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return redirect(`/sign-up?message=${error.message}&error=true`);
  }

  return redirect("/sign-up-success");
}

export const signIn = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect(`/login?message=${error.message}&error=true`);
  }

  return redirect("/");
};

export const logOut = async () => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error("Logout failed");
  }

  return redirect("/login");
};
