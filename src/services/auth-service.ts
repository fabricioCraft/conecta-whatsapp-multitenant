import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type RegisterUserWithOrgInput = {
  email: string;
  password: string;
  companyName?: string;
  orgName?: string;
  fullName?: string;
};

export type RegisterUserWithOrgResult = {
  userId: string;
  orgId: string;
  role: "admin" | "member";
};

type SupabaseLike = {
  auth: {
    signUp: (payload: { email: string; password: string }) => Promise<{
      data?: { user?: { id: string } };
      error?: { message?: string } | null;
    }>;
    admin?: {
      createUser: (payload: { email: string; password: string; email_confirm?: boolean }) => Promise<{
        data?: { user?: { id: string } };
        error?: { message?: string } | null;
      }>;
    };
  };
  from: (table: string) => any;
};

export async function registerUserWithOrg(
  supabaseOrInput: SupabaseLike | RegisterUserWithOrgInput,
  maybeInput?: RegisterUserWithOrgInput
): Promise<RegisterUserWithOrgResult> {
  const isClient = typeof supabaseOrInput === "object" && "auth" in supabaseOrInput && "from" in supabaseOrInput;
  const supabase: SupabaseLike = isClient ? (supabaseOrInput as SupabaseLike) : (createSupabaseAdmin() as unknown as SupabaseLike);
  const input: RegisterUserWithOrgInput = isClient ? (maybeInput as RegisterUserWithOrgInput) : (supabaseOrInput as RegisterUserWithOrgInput);

  const email = input.email;
  const password = input.password;
  const companyName = input.companyName ?? input.orgName;
  const fullName = input.fullName ?? "";

  if (!email || !password || !companyName) {
    throw new Error("Missing required fields");
  }

  let userId: string | undefined;
  const hasAdminCreate = supabase.auth && (supabase.auth as any).admin && typeof (supabase.auth as any).admin.createUser === "function";
  if (hasAdminCreate) {
    const adminRes = await (supabase.auth as any).admin.createUser({ email, password, email_confirm: true });
    if (adminRes?.error) {
      throw new Error(adminRes.error.message ?? "Failed to create user (admin)");
    }
    userId = adminRes?.data?.user?.id;
  } else {
    const signUpRes = await supabase.auth.signUp({ email, password });
    if (signUpRes?.error) {
      throw new Error(signUpRes.error.message ?? "Failed to sign up");
    }
    userId = signUpRes?.data?.user?.id;
  }
  if (!userId) {
    throw new Error("User ID not found");
  }

  const orgs = supabase.from("organizations");
  const sel = orgs.select("id");
  const hasIlike = sel && typeof sel.ilike === "function";
  const orgQueryRes = await (hasIlike ? sel.ilike("name", companyName) : sel.eq("name", companyName)).single();

  let orgId: string;
  let role: "admin" | "member";

  if (orgQueryRes && orgQueryRes.data && orgQueryRes.data.id) {
    orgId = orgQueryRes.data.id;
    role = "member";
  } else {
    const createdOrgRes = await supabase
      .from("organizations")
      .insert({ name: companyName })
      .select()
      .single();

    if (createdOrgRes?.error) {
      throw new Error(createdOrgRes.error.message ?? "Failed to create organization");
    }
    orgId = createdOrgRes?.data?.id;
    if (!orgId) {
      throw new Error("Organization ID not found after insert");
    }
    role = "admin";
  }

  const profileRes = await supabase
    .from("profiles")
    .insert({ id: userId, organization_id: orgId, role, full_name: fullName })
    .select()
    .single();

  if (profileRes?.error) {
    throw new Error(profileRes.error.message ?? "Failed to create profile");
  }

  return { userId, orgId, role };
}
