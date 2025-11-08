/**
 * @file api/tokens.js
 * @description نقطة النهاية (API Endpoint) لإدارة توكنات إشعارات Firebase (FCM).
 *
 * هذا الملف يعمل كواجهة خلفية (Serverless Function على Vercel) ويتولى العمليات المتعلقة بتوكنات FCM:
 * - POST: حفظ أو تحديث توكن FCM لمستخدم معين في جدول `user_tokens` باستخدام `ON CONFLICT`.
 * - DELETE: حذف توكن FCM لمستخدم معين (يُستخدم عند تسجيل الخروج).
 * - OPTIONS: معالجة طلبات CORS Preflight.
 */
import { createClient } from "@libsql/client/web";

export const config = {
  runtime: "edge",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(request) {
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (request.method === "POST") {
      console.log("[API: /api/tokens] Received POST request to save token.");
      const { user_key, token } = await request.json();

      if (!user_key || !token) {
        console.error("[API: /api/tokens] Bad Request: user_key or token is missing.");
        return new Response(
          JSON.stringify({ error: "user_key and token are required." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[API: /api/tokens] Saving token for user_key: ${user_key}`);
      // استخدام ON CONFLICT DO UPDATE للتعامل مع التوكنات الموجودة والمحدثة
      await db.execute({
        sql: "INSERT INTO user_tokens (user_key, fcm_token) VALUES (?, ?) ON CONFLICT(user_key) DO UPDATE SET fcm_token = excluded.fcm_token, created_at = CURRENT_TIMESTAMP",
        args: [user_key, token],
      });

      console.log(`[API: /api/tokens] Successfully saved token for user_key: ${user_key}`);
      return new Response(
        JSON.stringify({ success: true, message: "Token saved successfully." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (request.method === "DELETE") {
      const { user_key, token } = await request.json();

      if (!user_key || !token) {
        return new Response(
          JSON.stringify({ error: "user_key and token are required for deletion." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await db.execute({
        sql: "DELETE FROM user_tokens WHERE user_key = ? AND fcm_token = ?",
        args: [user_key, token],
      });

      return new Response(
        JSON.stringify({ success: true, message: "Token deleted successfully." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[API: /api/tokens] FATAL ERROR", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}