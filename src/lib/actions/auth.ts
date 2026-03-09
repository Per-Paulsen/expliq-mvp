"use server";

import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

const SALT_ROUNDS = 10;

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: { name: "My Workspace" },
    });

    await tx.user.create({
      data: {
        email,
        passwordHash,
        workspaceId: workspace.id,
      },
    });
  });

  return { success: true };
}
