// pages/api/me.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Return user with role from user_metadata
    const user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata.role || "user",
      access_token: token,
    };

    try {
      return res.status(200).json(user);
    } catch (err: unknown) {
      // Use safe string conversion for unknown error
      let message: string;
      if (typeof err === "string") {
        message = err;
      } else if (
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        message = (err as { message: string }).message;
      } else {
        message = "Unknown error";
      }
      return res.status(500).json({ error: message });
    }
  } catch (err: unknown) {
    let message: string;

    if (typeof err === "string") {
      message = err;
    } else if (
      typeof err === "object" &&
      err !== null &&
      "message" in err &&
      typeof (err as { message?: unknown }).message === "string"
    ) {
      message = (err as { message: string }).message;
    } else if (typeof err === "object" && err !== null) {
      message = "[object error]";
    } else {
      // Use safe string conversion for non-object, non-string values
      message = `${err}`;
    }
    return res.status(500).json({ error: message });
  }
}
