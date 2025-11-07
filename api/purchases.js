import { createClient } from "@libsql/client/web";

/**
 * @file api/purchases.js
 * @description نقطة نهاية API لجلب سجل مشتريات المستخدم.
 * 
 * تعالج هذه الدالة طلبات GET لجلب جميع المنتجات التي قام مستخدم معين بشرائها.
 * تتطلب `user_key` كمعامل استعلام (query parameter).
 * تقوم بتنفيذ استعلام يربط بين جداول `orders`, `order_items`, و `marketplace_products`
 * لإرجاع قائمة مفصلة بالمشتريات مرتبة حسب تاريخ الشراء.
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // ترويسات CORS للسماح بالطلبات
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const user_key = searchParams.get('user_key');

    if (!user_key) {
      return new Response(JSON.stringify({ error: 'معرّف المستخدم (user_key) مطلوب.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const db = createClient({
      url: process.env.DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // استعلام معقد لجلب تفاصيل المشتريات
    const { rows } = await db.execute({
      sql: `
        SELECT
          p.productName,
          p.product_price,
          p.ImageName,
          oi.quantity,
          o.created_at,
          o.order_status,
          o.order_key
        FROM orders AS o
        JOIN order_items AS oi ON o.order_key = oi.order_key
        JOIN marketplace_products AS p ON oi.product_key = p.product_key
        WHERE o.user_key = ?
        ORDER BY o.created_at DESC;
      `,
      args: [user_key],
    });

    return new Response(JSON.stringify(rows), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[API: /api/purchases] فشل فادح في جلب المشتريات:', error);
    return new Response(JSON.stringify({ error: 'حدث خطأ في الخادم أثناء جلب المشتريات.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}