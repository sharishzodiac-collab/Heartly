"""
Heartly Artisanal E-Commerce - Python Flask API & Web Server
Connects HTML frontend directly to MySQL heartly_db using mysql.connector
"""

import os
from flask import Flask, jsonify, request, send_from_directory
import db

app = Flask(__name__, static_folder='.', static_url_path='')

# Universal CORS headers
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response


# ============================================================================
# API Endpoints
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Check MySQL database connection status."""
    status = db.test_connection()
    if status['success']:
        return jsonify({
            "status": "online",
            "message": "Connected to MySQL successfully!",
            "details": status
        }), 200
    else:
        return jsonify({
            "status": "error",
            "message": "Could not connect to MySQL. Please check db_config.json",
            "details": status
        }), 500


@app.route('/api/products', methods=['GET'])
def list_products():
    """Retrieve product catalog directly from MySQL."""
    category = request.args.get('category', None)
    try:
        products = db.get_all_products(category=category)
        return jsonify({
            "success": True,
            "count": len(products),
            "products": products
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/orders', methods=['POST'])
def create_order():
    """Create a new customer order and save it into MySQL."""
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "No order data provided"}), 400
        
    try:
        result = db.save_order(data)
        return jsonify(result), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================================================
# Frontend Static File Serving
# ============================================================================

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')


@app.route('/<path:filename>')
def serve_static(filename):
    if os.path.exists(filename):
        return send_from_directory('.', filename)
    return jsonify({"error": "File not found"}), 404


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"\n=======================================================")
    print(f"🌸 Heartly E-Commerce Server Starting on http://localhost:{port}")
    print(f"=======================================================")
    
    # Run database connection check on startup
    status = db.test_connection()
    if status['success']:
        print(f" Connected to MySQL: {status['database']} (Version {status['version']})")
        print(f" Products ready in database: {status['total_products']}")
    else:
        print(f"⚠️  MySQL Notice: {status['error']}")
        print(f"👉 Please update your MySQL password in db_config.json")
    print(f"=======================================================\n")
    
    app.run(host='0.0.0.0', port=port, debug=True)
