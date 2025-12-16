// app/api/debug-token/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value;
  
  let decoded = null;
  let isValid = false;
  
  if (token) {
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
      isValid = true;
    } catch (err: any) {
      decoded = { error: err.message };
    }
  }
  
  return NextResponse.json({
    hasToken: !!token,
    tokenLength: token?.length,
    tokenPreview: token ? `${token}` : 'NO TOKEN',
    isValid,
    decoded,
    allCookies: cookieStore.getAll().map(c => ({ 
      name: c.name, 
      value: c.value.substring(0, 20) + '...' 
    })),
  });
}
// ```

// ---

// ## **Testing Steps:**

// 1. **Clear all browser cookies** (DevTools → Application → Cookies → Clear all)
// 2. **Login** and watch the console logs
// 3. **Visit** `http://localhost:3000/api/debug-token` in your browser
// 4. **Try the chat** endpoint

// ---

// ## **What to Look For:**

// After login, you should see:
// ```
// 🔐 Creating JWT with payload: { userId: '...', companiesCount: 2 }
// ✅ Token created, length: 250
// 🍪 Cookie 'authToken' set successfully