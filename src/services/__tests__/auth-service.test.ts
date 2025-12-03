import { describe, it, expect, vi } from "vitest";
import * as AuthService from "@/services/auth-service";

describe("registerUserWithOrg", () => {
  it("cria usuário, organização nova e perfil admin quando empresa não existe", async () => {
    const supabase: any = {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "organizations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: "No rows" } }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "org-1" }, error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "profile-1", role: "admin" }, error: null }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    const input = { email: "a@b.com", password: "secret", orgName: "Acme" };
    const result = await AuthService.registerUserWithOrg(supabase, input);

    expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: input.email, password: input.password });
    expect(result).toEqual({ userId: "user-1", orgId: "org-1", role: "admin" });
  });

  it("cria usuário e perfil member quando empresa já existe", async () => {
    const supabase: any = {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: "user-2" } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "organizations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "org-42" }, error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "profile-2", role: "member" }, error: null }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    const input = { email: "c@d.com", password: "secret", orgName: "Existing" };
    const result = await AuthService.registerUserWithOrg(supabase, input);

    expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: input.email, password: input.password });
    expect(result).toEqual({ userId: "user-2", orgId: "org-42", role: "member" });
  });
});
