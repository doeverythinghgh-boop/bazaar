# الملفات الثلاثة بعد إعادة الكتابة بشكل منسّق

## 1. drizzle-data-2025-11-16T11_16_15.961Z.json
```json
[
  { "table_name": "marketplace_products" },
  { "table_name": "order_items" },
  { "table_name": "orders" },
  { "table_name": "sqlite_sequence" },
  { "table_name": "updates" },
  { "table_name": "user_tokens" },
  { "table_name": "users" }
]
```

---

## 2. drizzle-data-2025-11-16T11_16_07.430Z.json
```json
[
  {
    "table_name": "marketplace_products",
    "column_id": 0,
    "column_name": "id",
    "data_type": "INTEGER",
    "is_not_null": 0,
    "default_value": null,
    "is_primary_key": 1
  },
  {
    "table_name": "marketplace_products",
    "column_id": 1,
    "column_name": "productName",
    "data_type": "TEXT",
    "is_not_null": 1,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "marketplace_products",
    "column_id": 2,
    "column_name": "product_key",
    "data_type": "TEXT",
    "is_not_null": 1,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "marketplace_products",
    "column_id": 3,
    "column_name": "user_key",
    "data_type": "TEXT",
    "is_not_null": 1,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "marketplace_products",
    "column_id": 4,
    "column_name": "product_description",
    "data_type": "TEXT",
    "is_not_null": 0,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "marketplace_products",
    "column_id": 5,
    "column_name": "product_price",
    "data_type": "REAL",
    "is_not_null": 1,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "marketplace_products",
    "column_id": 6,
    "column_name": "product_quantity",
    "data_type": "INTEGER",
    "is_not_null": 1,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "marketplace_products",
    "column_id": 7,
    "column_name": "user_message",
    "data_type": "TEXT",
    "is_not_null": 0,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "marketplace_products",
    "column_id": 8,
    "column_name": "user_note",
    "data_type": "TEXT",
    "is_not_null": 0,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "marketplace_products",
    "column_id": 9,
    "column_name": "ImageName",
    "data_type": "TEXT",
    "is_not_null": 0,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "marketplace_products",
    "column_id": 10,
    "column_name": "MainCategory",
    "data_type": "INTEGER",
    "is_not_null": 0,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "marketplace_products",
    "column_id": 11,
    "column_name": "SubCategory",
    "data_type": "INTEGER",
    "is_not_null": 0,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "marketplace_products",
    "column_id": 12,
    "column_name": "ImageIndex",
    "data_type": "INTEGER",
    "is_not_null": 0,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "marketplace_products",
    "column_id": 13,
    "column_name": "original_price",
    "data_type": "REAL",
    "is_not_null": 0,
    "default_value": null,
    "is_primary_key": 0
  },

  
  {
    "table_name": "order_items",
    "column_id": 0,
    "column_name": "id",
    "data_type": "INTEGER",
    "is_not_null": 0,
    "default_value": null,
    "is_primary_key": 1
  },
  {
    "table_name": "order_items",
    "column_id": 1,
    "column_name": "order_key",
    "data_type": "TEXT",
    "is_not_null": 1,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "order_items",
    "column_id": 2,
    "column_name": "product_key",
    "data_type": "TEXT",
    "is_not_null": 1,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "order_items",
    "column_id": 3,
    "column_name": "quantity",
    "data_type": "INTEGER",
    "is_not_null": 1,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "order_items",
    "column_id": 4,
    "column_name": "seller_key",
    "data_type": "TEXT",
    "is_not_null": 0,
    "default_value": null,
    "is_primary_key": 0
  },

  
  {
    "table_name": "orders",
    "column_id": 0,
    "column_name": "order_key",
    "data_type": "TEXT",
    "is_not_null": 1,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "orders",
    "column_id": 1,
    "column_name": "user_key",
    "data_type": "TEXT",
    "is_not_null": 1,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "orders",
    "column_id": 2,
    "column_name": "total_amount",
    "data_type": "REAL",
    "is_not_null": 1,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "orders",
    "column_id": 3,
    "column_name": "order_status",
    "data_type": "INTEGER",
    "is_not_null": 1,
    "default_value": "'0'",
    "is_primary_key": 0
  },
  {
    "table_name": "orders",
    "column_id": 4,
    "column_name": "created_at",
    "data_type": "numeric",
    "is_not_null": 0,
    "default_value": "CURRENT_TIMESTAMP",
    "is_primary_key": 0
  },

  
  { "table_name": "sqlite_sequence", "column_id": 0, "column_name": "name" },
  { "table_name": "sqlite_sequence", "column_id": 1, "column_name": "seq" },

  
  {
    "table_name": "updates",
    "column_id": 0,
    "column_name": "Id",
    "data_type": "INTEGER",
    "is_not_null": 0,
    "default_value": null,
    "is_primary_key": 1
  },
  {
    "table_name": "updates",
    "column_id": 1,
    "column_name": "txt",
    "data_type": "TEXT",
    "is_not_null": 0,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "updates",
    "column_id": 2,
    "column_name": "datetime",
    "data_type": "DATETIME",
    "is_not_null": 0,
    "default_value": "CURRENT_TIMESTAMP",
    "is_primary_key": 0
  },

  
  {
    "table_name": "user_tokens",
    "column_id": 0,
    "column_name": "id",
    "data_type": "INTEGER",
    "is_not_null": 0,
    "default_value": null,
    "is_primary_key": 1
  },
  {
    "table_name": "user_tokens",
    "column_id": 1,
    "column_name": "user_key",
    "data_type": "TEXT",
    "is_not_null": 1,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "user_tokens",
    "column_id": 2,
    "column_name": "fcm_token",
    "data_type": "TEXT",
    "is_not_null": 1,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "user_tokens",
    "column_id": 3,
    "column_name": "created_at",
    "data_type": "DATETIME",
    "is_not_null": 0,
    "default_value": "CURRENT_TIMESTAMP",
    "is_primary_key": 0
  },
  {
    "table_name": "user_tokens",
    "column_id": 4,
    "column_name": "platform",
    "data_type": "TEXT",
    "is_not_null": 0,
    "default_value": null,
    "is_primary_key": 0
  },

  
  {
    "table_name": "users",
    "column_id": 0,
    "column_name": "id",
    "data_type": "INTEGER",
    "is_not_null": 0,
    "default_value": null,
    "is_primary_key": 1
  },
  {
    "table_name": "users",
    "column_id": 1,
    "column_name": "username",
    "data_type": "TEXT",
    "is_not_null": 1,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "users",
    "column_id": 2,
    "column_name": "phone",
    "data_type": "TEXT",
    "is_not_null": 1,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "users",
    "column_id": 3,
    "column_name": "Password",
    "data_type": "TEXT",
    "is_not_null": 0,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "users",
    "column_id": 4,
    "column_name": "Address",
    "data_type": "TEXT",
    "is_not_null": 0,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "users",
    "column_id": 5,
    "column_name": "user_key",
    "data_type": "TEXT",
    "is_not_null": 1,
    "default_value": null,
    "is_primary_key": 0
  },
  {
    "table_name": "users",
    "column_id": 6,
    "column_name": "is_seller",
    "data_type": "INTEGER",
    "is_not_null": 0,
    "default_value": "0",
    "is_primary_key": 0
  }
]
```

---

## 3. drizzle-data-2025-11-16T11_14_50.789Z.json
```json
[
  {
    "table_name": "marketplace_products",
    "foreign_key_id": 0,
    "sequence": 0,
    "referenced_table": "users",
    "column_from": "user_key",
    "column_to": "user_key",
    "on_update_action": "CASCADE",
    "on_delete_action": "CASCADE",
    "match_type": "NONE"
  },
  {
    "table_name": "order_items",
    "foreign_key_id": 0,
    "sequence": 0,
    "referenced_table": "users",
    "column_from": "seller_key",
    "column_to": "user_key",
    "on_update_action": "CASCADE",
    "on_delete_action": "CASCADE",
    "match_type": "NONE"
  },
  {
    "table_name": "order_items",
    "foreign_key_id": 1,
    "sequence": 0,
    "referenced_table": "marketplace_products",
    "column_from": "product_key",
    "column_to": "product_key",
    "on_update_action": "CASCADE",
    "on_delete_action": "CASCADE",
    "match_type": "NONE"
  },
  {
    "table_name": "order_items",
    "foreign_key_id": 2,
    "sequence": 0,
    "referenced_table": "orders",
    "column_from": "order_key",
    "column_to": "order_key",
    "on_update_action": "CASCADE",
    "on_delete_action": "CASCADE",
    "match_type": "NONE"
  },
  {
    "table_name": "orders",
    "foreign_key_id": 0,
    "sequence": 0,
    "referenced_table": "users",
    "column_from": "user_key",
    "column_to": "user_key",
    "on_update_action": "NO ACTION",
    "on_delete_action": "NO ACTION",
    "match_type": "NONE"
  }
]
```

