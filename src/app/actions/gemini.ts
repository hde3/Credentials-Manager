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

IMPORTANT RULES:
- If a credential already exists in the vault snapshot below, NEVER use ADD_CREDENTIAL to update it. Use EDIT_CREDENTIAL instead.
- Folder names are CASE-INSENSITIVE for the user, but you MUST output the EXACT EXISTING folder name case from the vault snapshot. For example, if the snapshot has "Gmail" and the user asks to add something to "gmail", you MUST output "folder": "Gmail".
- If the user asks to perform multiple actions (like adding multiple credentials at once), you MUST output all of them as separate action objects within the JSON array.
- You MUST respond ONLY with a JSON array of action objects. No extra text before or after it. Even if there's only one action, put it in an array.

Examples:

User: "Put user@mail.com and pass 123 into Netflix"
\`\`\`json
[{"action":"ADD_CREDENTIAL","folder":"Netflix","loginId":"user@mail.com","password":"123"}]
\`\`\`

User: "Add user1@a.com pass 1 and user2@a.com pass 2 to Social"
\`\`\`json
[
  {"action":"ADD_CREDENTIAL","folder":"Social","loginId":"user1@a.com","password":"1"},
  {"action":"ADD_CREDENTIAL","folder":"Social","loginId":"user2@a.com","password":"2"}
]
\`\`\`

If there's an action, include nothing else.
Here is a snapshot of the current vault contents (with passwords removed for security). Pay close attention to the EXACT spelling and casing of existing folders:
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
