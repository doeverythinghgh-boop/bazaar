import { createClient } from "@libsql/client/web";

export const config = {
  runtime: "edge",
};

/**
 * @file api/updates.js
 * @description نقطة نهاية لإدارة جدول التحديثات (updates).
 *
 * - POST: لإضافة سجل تحديث جديد.
 */
export default async function handler(request) {
  // إعداد CORS للسماح بالطلبات من أي مصدر
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  if (request.method === "POST") {
    try {
      const { txt } = await request.json();
      if (!txt) {
        return new Response(JSON.stringify({ error: "النص (txt) مطلوب." }), { status: 400, headers });
      }

      await db.execute({ sql: "INSERT INTO updates (txt) VALUES (?)", args: [txt] });

      return new Response(JSON.stringify({ message: "تم تسجيل التحديث بنجاح." }), { status: 201, headers });
    } catch (error) {
      console.error("API Error in /api/updates:", error);
      return new Response(JSON.stringify({ error: "فشل في تسجيل التحديث.", details: error.message }), { status: 500, headers });
    }
  }

  return new Response(JSON.stringify({ error: `Method ${request.method} Not Allowed` }), { status: 405, headers });
}