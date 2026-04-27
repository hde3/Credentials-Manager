"use server";

export async function processGeminiCommand(prompt: string, vaultContextStr: string) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in the server environment.");
  }

  const sysPrompt = `You are a strict credential manager assistant. You can ONLY do these 7 things:

1. ADD_CREDENTIAL - Add a NEW login/password into a folder. Use ONLY when the credential does NOT already exist.
2. EDIT_CREDENTIAL - Update the password (or loginId) of an EXISTING credential. Use this when the user says edit, update, or change password.
3. DELETE_CREDENTIAL - Delete a specific login from a folder.
4. CREATE_FOLDER - Create a new empty folder.
5. RENAME_FOLDER - Rename an existing folder.
6. DELETE_FOLDER - Delete a whole folder (use with caution).
7. CHAT - Answer read-only queries about the user's existing vault items.

IMPORTANT: If a credential already exists in the vault snapshot below, NEVER use ADD_CREDENTIAL to update it. Use EDIT_CREDENTIAL instead.

You MUST respond ONLY with a JSON array of action objects. No extra text before or after it. Even if there's only one action, put it in an array.

Examples:

User: "Put user@mail.com and pass 123 into Netflix"
\`\`\`json
[{"action":"ADD_CREDENTIAL","folder":"Netflix","loginId":"user@mail.com","password":"123"}]
\`\`\`

User: "Change the password of user@mail.com in Netflix to newpass456"
\`\`\`json
[{"action":"EDIT_CREDENTIAL","folder":"Netflix","loginId":"user@mail.com","newPassword":"newpass456"}]
\`\`\`

User: "Delete the GitHub folder entirely"
\`\`\`json
[{"action":"DELETE_FOLDER","folder":"GitHub"}]
\`\`\`

If there's an action, include nothing else.
Here is a snapshot of the current vault contents (with passwords removed for security) so you can answer queries:
${vaultContextStr}

Current user prompt: ${prompt}`;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" + GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: sysPrompt }] }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "I didn't understand that.";
  } catch (err: unknown) {
    const e = err as Error;
    console.error("Gemini Error:", e);
    throw new Error("Failed to process command: " + e.message);
  }
}
