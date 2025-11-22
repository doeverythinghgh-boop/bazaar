import { createClient } from "@libsql/client/web";

export const config = {
  runtime: 'edge',
};
/**
 * @file api/database-analysis.js
 * @description تحليل قاعدة بيانات Turso بالكامل وحفظ جميع معلومات الجداول،
 * الأعمدة، وعلاقات المفاتيح الخارجية في ملف JSON.
 */

/**
 * @description تهيئة الاتصال بقاعدة البيانات Turso
 * @type {object}
 * @const
 */
const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

/**
 * @description ترويسات CORS للسماح بالطلبات من أي مصدر.
 * @type {object}
 * @const
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
/**
 * @description تحليل قاعدة البيانات بالكامل وتخزينها في ملف JSON.
 * @async
 * @function analyzeAndSaveDatabase
 * @returns {Promise<string>} 
 *   سلسلة نصية تحتوي على بيانات التحليل بصيغة JSON.
 * @throws {Error} إذا حدث خطأ أثناء الاتصال بقاعدة البيانات أو تنفيذ الاستعلامات.
 */
export async function analyzeAndSaveDatabase() {
  console.log("[API: /api/database-analysis] بدء تحليل قاعدة البيانات...");

  const result = {};
  
  // ✅ جديد: إضافة وصف تفصيلي للبيانات التي سيتم إرجاعها
  result.analysisDescription = {
    purpose: "This JSON object provides a comprehensive structural analysis of the SQLite database. It includes details on tables, columns, and foreign key relationships.",
    tableNames: "An array of strings, where each string is the name of a table in the database. System tables (e.g., 'sqlite_%') are excluded.",
    createStatements: "An object where each key is a table name (string) and the corresponding value is the full 'CREATE TABLE' SQL statement (string) for that table. This allows for a complete reconstruction of the table's schema.",
    tablesInfo: {
      description: "An object where each key is a table name (string). The value is an array of objects, with each object providing detailed information about a single column in that table, based on SQLite's `PRAGMA table_info`.",
      columnSchema: {
        cid: "Column ID (integer): The zero-indexed position of the column in the table.",
        name: "Column Name (string): The name of the column.",
        type: "Data Type (string): The declared data type of the column (e.g., 'TEXT', 'INTEGER', 'REAL').",
        notnull: "Not Null Constraint (integer): 1 if the column has a 'NOT NULL' constraint, 0 otherwise.",
        dflt_value: "Default Value (any): The default value for the column. It is `null` if no default value is specified.",
        pk: "Primary Key (integer): 1 if this column is part of the primary key, 0 otherwise. For a composite primary key, this will be 1 for all columns in the key."
      }
    },
    foreignKeys: {
      description: "An object where each key is a table name (string). The value is an array of objects, with each object describing a foreign key constraint originating from that table, based on SQLite's `PRAGMA foreign_key_list`.",
      foreignKeySchema: {
        id: "Constraint ID (integer): A unique ID for the foreign key constraint within the table.",
        seq: "Sequence Number (integer): The sequence number (starting from 0) for columns in a composite foreign key.",
        table: "Parent Table (string): The name of the parent table that the foreign key references.",
        from: "Child Column (string): The name of the column in the child table (the current table) that is part of the foreign key.",
        to: "Parent Column (string): The name of the column in the parent table that is being referenced.",
        on_update: "On Update Action (string): The action to take on 'ON UPDATE' (e.g., 'NO ACTION', 'CASCADE', 'SET NULL').",
        on_delete: "On Delete Action (string): The action to take on 'ON DELETE' (e.g., 'NO ACTION', 'CASCADE', 'SET NULL').",
        match: "Match Clause (string): The 'MATCH' clause for the foreign key (usually 'NONE')."
      }
    }
  };

  try {
    // 1️⃣ جلب أسماء جميع الجداول
    console.log("[DatabaseAnalysis] جلب أسماء الجداول...");
    const tablesRes = await db.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%';
    `);
    const tables = tablesRes.rows.map(row => row.name);
    result.tableNames = tables;
    console.log(`[DatabaseAnalysis] تم العثور على ${tables.length} جدول.`);

    // 2️⃣ جلب CREATE TABLE لكل جدول
    console.log("[DatabaseAnalysis] جلب CREATE TABLE لكل جدول...");
    const createStatements = {};
    const createRes = await db.execute(`
      SELECT name, sql FROM sqlite_master WHERE type='table';
    `);
    for (const row of createRes.rows) {
      createStatements[row.name] = row.sql;
    }
    result.createStatements = createStatements;

    // 3️⃣ جلب معلومات الأعمدة لكل جدول
    console.log("[DatabaseAnalysis] جلب معلومات الأعمدة لكل جدول...");
    const tablesInfo = {};
    const tableInfoStatements = tables.map(table => ({ sql: `PRAGMA table_info(${table});` }));
    const tableInfoResults = await db.batch(tableInfoStatements, 'read');
    for (const table of tables) {
      // نجد النتيجة المطابقة من خلال البحث في نتائج الدفعة
      const matchingResult = tableInfoResults.find(res => res.rows.length > 0 && tables.includes(table));
      tablesInfo[table] = matchingResult ? matchingResult.rows : [];
    }
    result.tablesInfo = tablesInfo;

    // 4️⃣ جلب العلاقات الخارجية لكل جدول
    console.log("[DatabaseAnalysis] جلب العلاقات الخارجية لكل جدول...");
    const foreignKeys = {};
    const fkStatements = tables.map(table => ({ sql: `PRAGMA foreign_key_list(${table});` }));
    const fkResults = await db.batch(fkStatements, 'read');
    for (const table of tables) {
      const matchingResult = fkResults.find(res => res.rows.length > 0 && tables.includes(table));
      foreignKeys[table] = matchingResult ? matchingResult.rows : [];
    }
    result.foreignKeys = foreignKeys;

    console.log("[DatabaseAnalysis] تم الانتهاء من التحليل بنجاح!");
    // 5️⃣ إرجاع النتائج كنص JSON
    return result;

  } catch (error) {
    console.error("[DatabaseAnalysis] خطأ أثناء التحليل:", error);
    throw error;
  }
}
/**
 * @description نقطة نهاية API لجلب تحليل شامل لهيكلية قاعدة البيانات.
 *   تتعامل مع طلبات `OPTIONS` (preflight) لـ CORS، وطلبات `GET`
 *   لإجراء التحليل وإرجاع النتائج.
 * @function handler
 * @param {Request} request - كائن طلب HTTP الوارد.
 * @returns {Promise<Response>} - وعد (Promise) يحتوي على كائن استجابة HTTP.
 */
export default async function handler(request) {
  // معالجة طلبات OPTIONS (preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method === 'GET') {
    try {
      const analysisResult = await analyzeAndSaveDatabase();
      return new Response(JSON.stringify(analysisResult, null, 2), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('[API: /api/database-analysis] فشل فادح في تحليل قاعدة البيانات:', error);
      return new Response(JSON.stringify({ error: 'حدث خطأ في الخادم أثناء تحليل قاعدة البيانات.', details: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
