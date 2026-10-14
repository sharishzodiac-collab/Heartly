"""
Heartly Artisanal E-Commerce - MySQL Database Connector
Handles database connections, querying products, creating orders, and user auth.
"""

import os
import json
import mysql.connector
from mysql.connector import Error

# Default connection settings - update with your MySQL credentials
DB_CONFIG = {
    'host': os.environ.get('MYSQL_HOST', 'localhost'),
    'user': os.environ.get('MYSQL_USER', 'root'),
    'password': os.environ.get('MYSQL_PASSWORD', 'YOUR_PASSWORD_HERE'),
    'database': os.environ.get('MYSQL_DATABASE', 'heartly_db'),
    'port': int(os.environ.get('MYSQL_PORT', 3306))
}

# If a local db_config.json exists, load from it
CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'db_config.json')
if os.path.exists(CONFIG_FILE):
    try:
        with open(CONFIG_FILE, 'r') as f:
            override = json.load(f)
            DB_CONFIG.update(override)
    except Exception as e:
        print(f"Notice: Could not read db_config.json: {e}")


def get_connection():
    """Establish and return a MySQL connection."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"MySQL Connection Error: {e}")
        raise e


def test_connection():
    """Verify that MySQL is connected and heartly_db is accessible."""
    try:
        conn = get_connection()
        if conn.is_connected():
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT DATABASE() AS current_db, VERSION() AS version;")
            info = cursor.fetchone()
            
            cursor.execute("SELECT COUNT(*) AS total_products FROM products;")
            products_count = cursor.fetchone()
            
            cursor.close()
            conn.close()
            return {
                "success": True,
                "database": info['current_db'],
                "version": info['version'],
                "total_products": products_count['total_products']
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def get_all_products(category=None):
    """Retrieve all active products from the MySQL products table."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if category and category.lower() != 'all':
            query = "SELECT * FROM products WHERE is_active = 1 AND LOWER(category) = %s ORDER BY id ASC;"
            cursor.execute(query, (category.lower(),))
        else:
            query = "SELECT * FROM products WHERE is_active = 1 ORDER BY id ASC;"
            cursor.execute(query)
            
        rows = cursor.fetchall()
        # Convert Decimal prices to float for JSON compatibility
        for row in rows:
            if 'price' in row and row['price'] is not None:
                row['price'] = float(row['price'])
        return rows
    finally:
        cursor.close()
        conn.close()


def save_order(order_data):
    """
    Save an order and its items into the orders and order_items tables.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        conn.start_transaction()
        
        # 1. Insert into orders
        order_sql = """
            INSERT INTO orders (
                order_number, user_id, receiver_name, receiver_phone, 
                receiver_email, gift_message, delivery_street, delivery_city, 
                delivery_zip, subtotal, delivery_fee, tax, total_amount, order_status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        # Parse address if given as single string or object
        address = order_data.get('address', '123 Artisan Way, Nashville, 37201')
        parts = [p.strip() for p in address.split(',')]
        street = parts[0] if len(parts) > 0 else '123 Artisan Way'
        city = parts[1] if len(parts) > 1 else 'Nashville'
        zip_code = parts[2] if len(parts) > 2 else '37201'
        
        totals = order_data.get('totals', {})
        subtotal = totals.get('subtotal', 0.0)
        delivery = totals.get('delivery', 12.0)
        tax = totals.get('tax', 0.0)
        total = totals.get('total', subtotal + delivery + tax)
        
        cursor.execute(order_sql, (
            order_data.get('orderId', 'HTLY-99999'),
            order_data.get('userId', None),
            order_data.get('receiverName', 'Anonymous'),
            order_data.get('receiverPhone', None),
            order_data.get('receiverEmail', None),
            order_data.get('giftMessage', None),
            street,
            city,
            zip_code,
            subtotal,
            delivery,
            tax,
            total,
            order_data.get('status', 'Order Placed')
        ))
        
        order_id = cursor.lastrowid
        
        # 2. Insert into order_items
        items = order_data.get('items', [])
        item_sql = """
            INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        for item in items:
            p_price = float(item.get('price', 0.0))
            p_qty = int(item.get('quantity', 1))
            cursor.execute(item_sql, (
                order_id,
                item.get('id') if isinstance(item.get('id'), int) else None,
                item.get('name', 'Handcrafted Gift'),
                p_price,
                p_qty,
                p_price * p_qty
            ))
            
        conn.commit()
        return {"success": True, "order_id": order_id, "order_number": order_data.get('orderId')}
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    print("Testing connection to MySQL heartly_db...")
    result = test_connection()
    if result['success']:
        print(f" Connected successfully!")
        print(f"Database: {result['database']}")
        print(f"MySQL Version: {result['version']}")
        print(f"Total Products in database: {result['total_products']}")
    else:
        print(f"❌ Connection failed: {result['error']}")
