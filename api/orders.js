import { createClient } from "@libsql/client/web";

/**
 * @file api/orders.js
 * @description نقطة نهاية API لإنشاء طلبات جديدة.
 * 
 * تعالج هذه الدالة طلبات POST لإنشاء طلب جديد في قاعدة البيانات.
 * تستقبل بيانات الطلب (المستخدم، المبلغ الإجمالي، العناصر) وتقوم بتنفيذ
 * عملية إدخال مجمعة (batch) في جدولي `orders` و `order_items`.
 * هذا يضمن أن يتم إنشاء الطلب وعناصره معًا أو لا يتم إنشاؤها على الإطلاق.
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // ✅ جديد: إضافة ترويسات CORS للسماح بالطلبات من أي مصدر
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // ✅ جديد: معالجة طلبات OPTIONS (preflight) التي يرسلها المتصفح
  if (request.method === 'OPTIONS') {
    console.log('[CORS] تمت معالجة طلب OPTIONS لـ /api/orders');
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('[API: /api/orders] بدء معالجة طلب إنشاء طلب جديد...');
    const { order_key, user_key, total_amount, items } = await request.json();
    console.log('[API: /api/orders] البيانات المستلمة:', { order_key, user_key, total_amount, items_count: items.length });

    // التحقق من وجود البيانات الأساسية
    if (!order_key || !user_key || !total_amount || !items || items.length === 0) {
      console.error('[API: /api/orders] خطأ: بيانات الطلب غير مكتملة.');
      return new Response(JSON.stringify({ error: 'بيانات الطلب غير مكتملة.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const db = createClient({
      url: process.env.DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // بناء مجموعة من الاستعلامات لتنفيذها في معاملة واحدة
    const statements = [];

    // 1. إضافة الطلب الرئيسي إلى جدول `orders`
    statements.push({
      sql: "INSERT INTO orders (order_key, user_key, total_amount, order_status) VALUES (?, ?, ?, 'pending')",
      args: [order_key, user_key, total_amount],
    });

    // 2. إضافة كل عنصر من عناصر السلة إلى جدول `order_items`
    for (const item of items) {
      statements.push({
        sql: "INSERT INTO order_items (order_key, product_key, quantity, seller_key) VALUES (?, ?, ?, ?)",
        args: [
          order_key, 
          item.product_key, 
          item.quantity || 1, // 💡 إصلاح: تعيين قيمة افتراضية (1) للكمية إذا كانت غير موجودة
          item.seller_key
        ],
      });
    }

    // تنفيذ جميع الاستعلامات دفعة واحدة
    console.log('[API: /api/orders] جاري تنفيذ عملية الإدخال في قاعدة البيانات...');
    await db.batch(statements, 'write');
    console.log('[API: /api/orders] نجاح! تم إنشاء الطلب في قاعدة البيانات.');

    return new Response(JSON.stringify({ success: true, message: 'تم إنشاء الطلب بنجاح.', order_key }), {
      status: 201, // 201 Created
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[API: /api/orders] فشل فادح في إنشاء الطلب:', error);
    return new Response(JSON.stringify({ error: 'حدث خطأ في الخادم أثناء إنشاء الطلب.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}