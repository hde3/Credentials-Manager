"use server";

import { createClient } from "@supabase/supabase-js";
import { isAllowedEmail } from "@/lib/allowedEmails";

/**
 * Server Actions are public endpoints. Without this guard anyone could call
 * the action and burn the Gemini quota, so we verify the caller's Supabase
 * access token before doing any work.
 */
async function requireAuthorisedUser(accessToken?: string) {
  if (!accessToken) throw new Error("Not authenticated.");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase is not configured.");

  const client = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await client.auth.getUser(accessToken);

  if (error || !data.user) throw new Error("Not authenticated.");
  if (!isAllowedEmail(data.user.email)) throw new Error("Access denied.");

  return data.user;
}

export async function processGeminiCommand(
  prompt: string,
  vaultContextStr: string,
  accessToken?: string
) {
  try {
    await requireAuthorisedUser(accessToken);

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured.");

    const systemInstruction = `You are a strict credential manager assistant. You can ONLY perform these actions. You MUST respond with a JSON array only — absolutely no extra text, no markdown fences, no explanation.

ACTIONS:
1. ADD_CREDENTIAL    – add a NEW credential (only if it does NOT already exist)
2. EDIT_CREDENTIAL   – update loginId/password of an EXISTING credential
3. DELETE_CREDENTIAL – delete a specific credential
4. CREATE_FOLDER     – create a new empty folder
5. RENAME_FOLDER     – rename an existing folder
6. DELETE_FOLDER     – delete an entire folder
7. CHAT              – answer a read-only question about the vault

RULES:
- If a credential already exists, use EDIT_CREDENTIAL, never ADD_CREDENTIAL.
- Folder names are case-insensitive from the user's side, but output the EXACT casing from the vault snapshot.
- For multiple actions, output all as separate objects in the array.
- ALWAYS output ONLY a raw JSON array. Example:

[{"action":"ADD_CREDENTIAL","folder":"Netflix","loginId":"user@mail.com","password":"abc123"}]
[{"action":"EDIT_CREDENTIAL","folder":"Netflix","currentLoginId":"user@mail.com","newLoginId":"user@mail.com","newPassword":"newpass"}]
[{"action":"DELETE_CREDENTIAL","folder":"Netflix","loginId":"user@mail.com"}]
[{"action":"CREATE_FOLDER","folder":"Work"}]
[{"action":"RENAME_FOLDER","oldFolder":"Work","newFolder":"Office"}]
[{"action":"DELETE_FOLDER","folder":"Work"}]
[{"action":"CHAT","message":"You have 3 credentials in Netflix."}]

Current vault snapshot (passwords hidden):
${vaultContextStr}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 512,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    // Belt-and-braces: strip markdown fences even though we asked for raw JSON.
    const cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim() || "[]";
    return { data: cleanText };
  } catch (err: unknown) {
    const e = err as Error;
    console.error("Gemini Error:", e);
    return { error: e.message };
  }
}
