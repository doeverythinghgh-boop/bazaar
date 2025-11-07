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
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { order_key, user_key, total_amount, items } = await request.json();

    // التحقق من وجود البيانات الأساسية
    if (!order_key || !user_key || !total_amount || !items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'بيانات الطلب غير مكتملة.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
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
        sql: "INSERT INTO order_items (order_key, product_key, quantity) VALUES (?, ?, ?)",
        args: [order_key, item.product_key, item.quantity],
      });
    }

    // تنفيذ جميع الاستعلامات دفعة واحدة
    await db.batch(statements, 'write');

    return new Response(JSON.stringify({ success: true, message: 'تم إنشاء الطلب بنجاح.', order_key }), {
      status: 201, // 201 Created
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('فشل في إنشاء الطلب:', error);
    return new Response(JSON.stringify({ error: 'حدث خطأ في الخادم أثناء إنشاء الطلب.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}