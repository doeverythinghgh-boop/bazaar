# الملفات الثلاثة بعد تحويلها إلى جداول منظمة

---

## **1. جدول أسماء الجداول — drizzle-data-2025-11-16T11_16_15.961Z.json**

| رقم | اسم الجدول |
|-----|-------------|
| 1 | marketplace_products |
| 2 | order_items |
| 3 | orders |
| 4 | sqlite_sequence |
| 5 | updates |
| 6 | user_tokens |
| 7 | users |

---

## **2. جداول الأعمدة — drizzle-data-2025-11-16T11_16_07.430Z.json**

### **🔹 جدول marketplace_products**
| رقم العمود | اسم العمود | النوع | NOT NULL | القيمة الافتراضية | مفتاح أساسي |
|------------|------------|--------|-----------|-------------------|---------------|
| 0 | id | INTEGER | 0 | NULL | 1 |
| 1 | productName | TEXT | 1 | NULL | 0 |
| 2 | product_key | TEXT | 1 | NULL | 0 |
| 3 | user_key | TEXT | 1 | NULL | 0 |
| 4 | product_description | TEXT | 0 | NULL | 0 |
| 5 | product_price | REAL | 1 | NULL | 0 |
| 6 | product_quantity | INTEGER | 1 | NULL | 0 |
| 7 | user_message | TEXT | 0 | NULL | 0 |
| 8 | user_note | TEXT | 0 | NULL | 0 |
| 9 | ImageName | TEXT | 0 | NULL | 0 |
| 10 | MainCategory | INTEGER | 0 | NULL | 0 |
| 11 | SubCategory | INTEGER | 0 | NULL | 0 |
| 12 | ImageIndex | INTEGER | 0 | NULL | 0 |
| 13 | original_price | REAL | 0 | NULL | 0 |

---

### **🔹 جدول order_items**
| رقم العمود | اسم العمود | النوع | NOT NULL | القيمة الافتراضية | مفتاح أساسي |
|------------|------------|--------|-----------|-------------------|---------------|
| 0 | id | INTEGER | 0 | NULL | 1 |
| 1 | order_key | TEXT | 1 | NULL | 0 |
| 2 | product_key | TEXT | 1 | NULL | 0 |
| 3 | quantity | INTEGER | 1 | NULL | 0 |
| 4 | seller_key | TEXT | 0 | NULL | 0 |

---

### **🔹 جدول orders**
| رقم العمود | اسم العمود | النوع | NOT NULL | القيمة الافتراضية | مفتاح أساسي |
|------------|------------|--------|-----------|-------------------|---------------|
| 0 | order_key | TEXT | 1 | NULL | 0 |
| 1 | user_key | TEXT | 1 | NULL | 0 |
| 2 | total_amount | REAL | 1 | NULL | 0 |
| 3 | order_status | INTEGER | 1 | '0' | 0 |
| 4 | created_at | numeric | 0 | CURRENT_TIMESTAMP | 0 |

---

### **🔹 جدول sqlite_sequence**
| رقم العمود | اسم العمود |
|------------|-------------|
| 0 | name |
| 1 | seq |

---

### **🔹 جدول updates**
| رقم العمود | اسم العمود | النوع | NOT NULL | القيمة الافتراضية | مفتاح أساسي |
|------------|------------|--------|-----------|-------------------|---------------|
| 0 | Id | INTEGER | 0 | NULL | 1 |
| 1 | txt | TEXT | 0 | NULL | 0 |
| 2 | datetime | DATETIME | 0 | CURRENT_TIMESTAMP | 0 |

---

### **🔹 جدول user_tokens**
| رقم العمود | اسم العمود | النوع | NOT NULL | القيمة الافتراضية | مفتاح أساسي |
|------------|------------|--------|-----------|-------------------|---------------|
| 0 | id | INTEGER | 0 | NULL | 1 |
| 1 | user_key | TEXT | 1 | NULL | 0 |
| 2 | fcm_token | TEXT | 1 | NULL | 0 |
| 3 | created_at | DATETIME | 0 | CURRENT_TIMESTAMP | 0 |
| 4 | platform | TEXT | 0 | NULL | 0 |

---

### **🔹 جدول users**
| رقم العمود | اسم العمود | النوع | NOT NULL | القيمة الافتراضية | مفتاح أساسي |
|------------|------------|--------|-----------|-------------------|---------------|
| 0 | id | INTEGER | 0 | NULL | 1 |
| 1 | username | TEXT | 1 | NULL | 0 |
| 2 | phone | TEXT | 1 | NULL | 0 |
| 3 | Password | TEXT | 0 | NULL | 0 |
| 4 | Address | TEXT | 0 | NULL | 0 |
| 5 | user_key | TEXT | 1 | NULL | 0 |
| 6 | is_seller | INTEGER | 0 | 0 | 0 |

---

## **3. جداول العلاقات (Foreign Keys) — drizzle-data-2025-11-16T11_14_50.789Z.json**

| الجدول | FK ID | العمود | يرتبط بـ | العمود في الجدول الآخر | عند التحديث | عند الحذف | نوع المطابقة |
|--------|-------|---------|-----------|------------------------|--------------|-------------|----------------|
| marketplace_products | 0 | user_key | users | user_key | CASCADE | CASCADE | NONE |
| order_items | 0 | seller_key | users | user_key | CASCADE | CASCADE | NONE |
| order_items | 1 | product_key | marketplace_products | product_key | CASCADE | CASCADE | NONE |
| order_items | 2 | order_key | orders | order_key | CASCADE | CASCADE | NONE |
| orders | 0 | user_key | users | user_key | NO ACTION | NO ACTION | NONE |

---

تم الآن تحويل **كل الملفات الثلاثة** إلى جداول واضحة ومقسمة حسب نوع البيانات.

إذا أردت:
✔ تحويلها إلى أوامر SQL 
✔ أو إنشاء ERD Diagram 
✔ أو إعادة ترتيبها بصيغة Drizzle ORM

أنا جاهز 😎🔥

