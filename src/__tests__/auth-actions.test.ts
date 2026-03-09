import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockHash } = vi.hoisted(() => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  const mockHash = vi.fn().mockResolvedValue("hashed_password_123");
  return { mockPrisma, mockHash };
});

vi.mock("@/generated/prisma/client", () => ({
  PrismaClient: vi.fn(),
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: mockHash,
  },
}));

import { signup } from "@/lib/actions/auth";

function createFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
}

describe("signup action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when email is empty", async () => {
    const fd = createFormData({ email: "", password: "password123" });
    const result = await signup(fd);
    expect(result).toEqual({ error: "Email and password are required" });
  });

  it("returns error when password is empty", async () => {
    const fd = createFormData({ email: "test@example.com", password: "" });
    const result = await signup(fd);
    expect(result).toEqual({ error: "Email and password are required" });
  });

  it("returns error when password is shorter than 8 characters", async () => {
    const fd = createFormData({ email: "test@example.com", password: "short" });
    const result = await signup(fd);
    expect(result).toEqual({
      error: "Password must be at least 8 characters",
    });
  });

  it("returns error when user already exists", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "existing-id",
      email: "test@example.com",
    });

    const fd = createFormData({
      email: "test@example.com",
      password: "password123",
    });
    const result = await signup(fd);
    expect(result).toEqual({
      error: "An account with this email already exists",
    });
  });

  it("returns success on valid signup", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockResolvedValue(undefined);

    const fd = createFormData({
      email: "new@example.com",
      password: "password123",
    });
    const result = await signup(fd);
    expect(result).toEqual({ success: true });
  });

  it("calls bcrypt.hash with the password and salt rounds", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockResolvedValue(undefined);

    const fd = createFormData({
      email: "new@example.com",
      password: "mypassword",
    });
    await signup(fd);
    expect(mockHash).toHaveBeenCalledWith("mypassword", 10);
  });
});
