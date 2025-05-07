import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from functools import wraps
from dotenv import load_dotenv
import sqlite3
import json
import base64
from datetime import datetime
import importlib.util
import sys
import numpy as np
from getEnergy import getEnergy
import io
import zipfile
import csv
from flask import Flask, request, jsonify, send_file  # Add send_file to imports
import random
import traceback
from werkzeug.exceptions import HTTPException

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='static')
app.config['PROPAGATE_EXCEPTIONS'] = False
CORS(app)

# --------------------------------------------------
@app.errorhandler(Exception)
def handle_all_errors(e):
    # if it’s an HTTPException, pull its code, otherwise 500
    code = getattr(e, 'code', 500)
    return jsonify({
        "error": str(e)
    }), code
    
def handle_http_exception(e):
    # e.code is the HTTP status (e.g. 405), e.description is the plain‑text message
    return jsonify({
        "error": e.description
    }), e.code
# --------------------------------------------------


# Configure upload folder and allowed file extensions
VEHICLE_UPLOAD_FOLDER = 'uploads'
CALCULATION_UPLOAD_FOLDER = 'calculation_files'
ALLOWED_EXTENSIONS = {'csv', 'txt', '.py'}
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['VEHICLE_UPLOAD_FOLDER'] = VEHICLE_UPLOAD_FOLDER
app.config['CALCULATION_UPLOAD_FOLDER'] = CALCULATION_UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = None

# Ensure upload folder exists
os.makedirs(VEHICLE_UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CALCULATION_UPLOAD_FOLDER, exist_ok=True)

# Database setup
def get_db_connection():
    conn = sqlite3.connect(os.getenv('DATABASE_PATH', 'energy_estimation.db'))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    try:
        with open('setup.sql', 'r') as sql_file:
            conn.executescript(sql_file.read())
        conn.commit()
        print("Database initialized successfully.")
    except sqlite3.IntegrityError:
        print("Database already initialized. Skipping initialization.")
    except Exception as e:
        print(f"An error occurred during database initialization: {e}")
    finally:
        conn.close()

# Initialize the database
init_db()

# Admin authentication setup
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', '1234')

def is_admin(username, password):
    return username == ADMIN_USERNAME and password == ADMIN_PASSWORD

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not is_admin(auth.username, auth.password):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def allowed_image(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

def parse_speed_profile(file_path):
    """Parse speed profile file and return list of speed values."""
    speed_data = []
    try:
        with open(file_path, 'r') as file:
            # Try reading as CSV first
            try:
                for line in file:
                    try:
                        # Handle both comma-separated and single values
                        values = line.strip().split(',')
                        for value in values:
                            speed = float(value.strip())
                            # Ensure no negative speeds and handle zero speeds
                            speed = max(0.001, speed)
                            speed_data.append(speed)
                    except ValueError:
                        continue
                        
            except:
                # If CSV reading fails, try reading as plain text
                file.seek(0)  # Reset file pointer to beginning
                for line in file:
                    try:
                        speed = float(line.strip())
                        # Ensure no negative speeds and handle zero speeds
                        speed = max(0.001, speed)
                        speed_data.append(speed)
                    except ValueError:
                        continue
                        
        if not speed_data:
            raise ValueError("No valid speed data found in file")
            
        return speed_data
    except Exception as e:
        raise ValueError(f"Error parsing speed profile: {str(e)}")

@app.route('/')
def home():
    return "Welcome to the Energy Estimation API!"

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
    
    conn = get_db_connection()
    existing_user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    
    if existing_user:
        conn.close()
        return jsonify({"error": "Username already exists"}), 400
    
    hashed_password = generate_password_hash(password)
    conn.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, hashed_password))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "User created successfully", "username": username}), 201

@app.route('/api/login', methods=['POST'])
def signin():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
    
    # First check if it's admin
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        return jsonify({
            "message": "Login successful",
            "username": username,
            "is_admin": True
        }), 200
    
    # Then check regular user login
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()
    
    if user and check_password_hash(user['password'], password):
        return jsonify({
            "message": "Login successful",
            "username": user['username'],
            "is_admin": user['is_admin']
        }), 200
    
    return jsonify({"error": "Invalid username or password"}), 401

@app.route('/api/vehicle-types', methods=['GET'])
def get_vehicle_types():
    conn = get_db_connection()
    try:
        vehicle_types = conn.execute('''
            SELECT id, type_name, full_name, engine_id 
            FROM vehicle_types
            ORDER BY id
        ''').fetchall()
        return jsonify([{
            'id': vt['id'],
            'name': vt['type_name'],
            'full_name': vt['full_name'],
            'engine_id': vt['engine_id']
        } for vt in vehicle_types])
    finally:
        conn.close()

@app.route('/api/admin/vehicle-types', methods=['POST'])
@admin_required
def add_vehicle_type():
    data = request.json
    
    # Validate required fields
    required_fields = ['type_name', 'full_name', 'engine_id']
    if not all(field in data for field in required_fields):
        return jsonify({
            "error": "Missing required fields. Need type_name, full_name, and engine_id"
        }), 400
    
    # Validate data types
    try:
        engine_id = int(data['engine_id'])
        type_name = str(data['type_name']).strip().upper()
        full_name = str(data['full_name']).strip()
    except (ValueError, TypeError):
        return jsonify({
            "error": "Invalid data types. engine_id must be an integer"
        }), 400
    
    # Validate engine_id is positive
    if engine_id <= 0:
        return jsonify({
            "error": "engine_id must be a positive integer"
        }), 400
    
    conn = get_db_connection()
    try:
        # Check for existing type_name or engine_id
        existing = conn.execute('''
            SELECT type_name, engine_id FROM vehicle_types 
            WHERE type_name = ? OR engine_id = ?
        ''', (type_name, engine_id)).fetchone()
        
        if existing:
            if existing['type_name'] == type_name:
                return jsonify({
                    "error": f"Vehicle type {type_name} already exists"
                }), 409
            else:
                return jsonify({
                    "error": f"Engine ID {engine_id} is already in use"
                }), 409
        
        # Insert new vehicle type
        conn.execute('''
            INSERT INTO vehicle_types (type_name, full_name, engine_id)
            VALUES (?, ?, ?)
        ''', (type_name, full_name, engine_id))
        conn.commit()
        
        return jsonify({
            "message": "Vehicle type added successfully",
            "type": {
                "type_name": type_name,
                "full_name": full_name,
                "engine_id": engine_id
            }
        }), 201
        
    except sqlite3.Error as e:
        return jsonify({
            "error": f"Database error: {str(e)}"
        }), 500
    finally:
        conn.close()

@app.route('/api/admin/vehicle-types/<int:type_id>', methods=['DELETE'])
@admin_required
def delete_vehicle_type(type_id):
    conn = get_db_connection()
    try:
        # Check if vehicle type exists
        vehicle_type = conn.execute('SELECT * FROM vehicle_types WHERE id = ?', (type_id,)).fetchone()
        if not vehicle_type:
            return jsonify({"error": "Vehicle type not found"}), 404
            
        # Check if there are any vehicle parameters using this type
        params = conn.execute('SELECT COUNT(*) as count FROM vehicle_params WHERE vehicle_type_id = ?', 
                            (type_id,)).fetchone()
        if params['count'] > 0:
            return jsonify({
                "error": "Cannot delete vehicle type that has associated parameters"
            }), 400
            
        # Delete the vehicle type
        conn.execute('DELETE FROM vehicle_types WHERE id = ?', (type_id,))
        conn.commit()
        
        return jsonify({
            "message": f"Vehicle type {vehicle_type['type_name']} deleted successfully"
        }), 200
        
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()
        
@app.route('/api/vehicle-params', methods=['GET'])
def get_vehicle_params():
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
       SELECT 
         vp.id,
         vp.vehicle_type_id,
         vt.type_name,
         vp.make,
         vp.model,
         vp.year,
         vp.param_string
       FROM vehicle_params AS vp
       JOIN vehicle_types   AS vt
         ON vp.vehicle_type_id = vt.id
       ORDER BY vp.id;
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()

    result = [
        {
            "id":               row[0],
            "vehicle_type_id":  row[1],
            "type_name":        row[2],
            "make":             row[3],
            "model":            row[4],
            "year":             row[5],
            "param_string":     row[6],
        }
        for row in rows
    ]
    return jsonify(result)


@app.route('/api/admin/clear-vehicle-params', methods=['POST'])
@admin_required
def clear_vehicle_params():
    try:
        conn = get_db_connection()
        conn.execute('DELETE FROM vehicle_params')
        conn.commit()
        conn.close()
        return jsonify({"message": "Vehicle parameters cleared successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Error clearing parameters: {str(e)}"}), 500

@app.route('/api/admin/vehicle-params', methods=['POST'])
@admin_required
def create_vehicle_param():
    data = request.get_json() or {}
    # required fields
    for f in ('vehicle_type_id','make','model','year','param_string'):
        if f not in data:
            return jsonify({'error': f'Missing field {f}'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO vehicle_params
              (vehicle_type_id, make, model, year, param_string)
            VALUES (?,?,?,?,?)
        ''', (
            int(data['vehicle_type_id']),
            data['make'],
            data['model'],
            int(data['year']),
            data['param_string']
        ))
        conn.commit()
        new_id = cursor.lastrowid
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

    return jsonify({'message':'Vehicle added','id':new_id}), 201


@app.route('/api/admin/vehicle-params/<int:param_id>', methods=['PUT'])
@admin_required
def update_vehicle_param(param_id):
    data = request.get_json() or {}
    # ensure all required fields are present
    for f in ('vehicle_type_id','make','model','year','param_string'):
        if f not in data:
            return jsonify({'error': f'Missing field {f}'}), 400

    try:
        conn = get_db_connection()
        # make sure this record exists
        row = conn.execute(
            'SELECT 1 FROM vehicle_params WHERE id = ?', (param_id,)
        ).fetchone()
        if not row:
            return jsonify({'error': 'Vehicle parameter not found'}), 404

        # perform the update
        conn.execute('''
            UPDATE vehicle_params
               SET vehicle_type_id = ?,
                   make             = ?,
                   model            = ?,
                   year             = ?,
                   param_string     = ?
             WHERE id = ?
        ''', (
            int(data['vehicle_type_id']),
            data['make'],
            data['model'],
            int(data['year']),
            data['param_string'],
            param_id
        ))
        conn.commit()
        return jsonify({'message':'Vehicle updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        conn.close()


@app.route('/api/admin/vehicle-params/<int:param_id>', methods=['DELETE'])
@admin_required
def delete_vehicle_param(param_id):
    conn = get_db_connection()
    try:
        # make sure it exists
        row = conn.execute('SELECT * FROM vehicle_params WHERE id = ?', (param_id,)).fetchone()
        if not row:
            return jsonify({"error": "Vehicle parameter not found"}), 404

        conn.execute('DELETE FROM vehicle_params WHERE id = ?', (param_id,))
        conn.commit()
        return jsonify({"message": "Vehicle parameter deleted"}), 200

    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {e}"}), 500

    finally:
        conn.close()
        



@app.route('/api/admin/upload-calculation', methods=['POST'])
def upload_calculation():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    # Save to the "all" directory
    base_folder = app.config['CALCULATION_UPLOAD_FOLDER']
    all_vehicle_folder = os.path.join(base_folder, "all")
    os.makedirs(all_vehicle_folder, exist_ok=True)

    file_path = os.path.join(all_vehicle_folder, file.filename)
    file.save(file_path)

    return jsonify({"message": "File uploaded successfully to 'all' directory."}), 200

    
@app.route('/api/estimate', methods=['POST'])
def estimate_energy():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    username = request.form.get('username')
    vehicle_param_id = request.form.get('vehicle_param_id')
    collection_id = request.form.get('collection_id')

    if not all([username, vehicle_param_id, collection_id]):
        return jsonify({"error": "Username, vehicle_param_id, and collection_id are required"}), 400

    try:
        param_id = int(vehicle_param_id)
    except ValueError:
        return jsonify({"error": "Invalid vehicle_param_id"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400

    conn = None
    try:
        # 1) save & parse the speed profile
        filename = secure_filename(file.filename)
        tmp = os.path.join(app.config['VEHICLE_UPLOAD_FOLDER'], filename)
        file.save(tmp)
        try:
            speed_data = parse_speed_profile(tmp)
            if len(speed_data) < 2:
                raise ValueError("Speed profile must contain at least 2 data points")
        finally:
            os.remove(tmp)

        # 2) fetch the param_string *and* the vehicle_type_id (1–4)
        conn = get_db_connection()
        row = conn.execute('''
            SELECT vp.param_string,
                   vt.id AS vehicle_type_id,
                   vt.type_name
            FROM vehicle_params AS vp
            JOIN vehicle_types  AS vt ON vp.vehicle_type_id = vt.id
            WHERE vp.id = ?
        ''', (param_id,)).fetchone()

        if not row:
            return jsonify({"error": "Vehicle parameters not found"}), 400

        param_list      = row['param_string'].split()
        vehicle_type_id = row['vehicle_type_id']
        vehicle_name    = row['type_name']

        # 3) call getEnergy with the *type* id, not the param PK
        try:
            result = getEnergy(vehicle_type_id, speed_data, param_list)
        except Exception as calc_error:
            return jsonify({"error": f"Energy calculation failed: {calc_error}"}), 400

        # 4) stash the result under the *param_id* key in collections.results
        conn.execute('''
            UPDATE collections
            SET results = json_set(
                COALESCE(results, '{}'),
                '$."' || ? || '"',
                json(?)
            )
            WHERE username = ? AND id = ?
        ''', (
            str(param_id),
            json.dumps({
                'vehicle_type':  vehicle_name,
                'result_data':   result,
                'make':          None,  # you can fill make/model/year here if you want
                'model':         None,
                'year':          None,
                'timestamp':     datetime.now().isoformat()
            }),
            username,
            collection_id
        ))
        conn.commit()

        return jsonify(result)

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400

    except Exception as e:
        return jsonify({"error": f"Error processing request: {e}"}), 500

    finally:
        if conn:
            conn.close()


@app.route('/api/collections', methods=['POST'])
def create_collection():
    """Create a new collection with speed profile and optional image."""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No speed profile file provided"}), 400
        
        file = request.files['file']
        image_file = request.files.get('image')  # Optional image file
        username = request.form.get('username')
        name = request.form.get('name')
        description = request.form.get('description', '')
        
        if not all([username, name, file.filename]):
            return jsonify({"error": "Username, collection name and speed profile file are required"}), 400
            
        if not allowed_file(file.filename):
            return jsonify({"error": "Speed profile file type not allowed"}), 400

        # Handle speed profile file
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['VEHICLE_UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        try:
            speed_data = parse_speed_profile(file_path)
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)

        # Handle image file if provided
        image_data = None
        image_type = None
        if image_file and image_file.filename:
            if not allowed_image(image_file.filename):
                return jsonify({"error": "Image file must be jpg, jpeg, png, or gif"}), 400
                
            # Read image data directly
            image_data = base64.b64encode(image_file.read()).decode('utf-8')
            image_type = image_file.content_type
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO collections (
                username, name, description, image_data, image_type,
                speed_profile, results, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            username,
            name,
            description,
            image_data,
            image_type,
            json.dumps(speed_data),
            '{}',
            datetime.now().isoformat()
        ))
        
        collection_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            "message": "Collection created successfully",
            "collection_id": collection_id
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/collections/<username>', methods=['GET'])
def get_user_collections(username):
    """Get all collections for a user."""
    conn = get_db_connection()
    
    collections = conn.execute('''
        SELECT id, name, description, image_data, image_type,
               speed_profile, results, created_at
        FROM collections
        WHERE username = ?
        ORDER BY created_at DESC
    ''', (username,)).fetchall()
    
    result = [{
        'id': c['id'],
        'name': c['name'],
        'description': c['description'],
        'image_url': f"data:{c['image_type']};base64,{c['image_data']}" if c['image_data'] else None,
        'created_at': c['created_at'],
        'speed_profile': json.loads(c['speed_profile']),
        'results': json.loads(c['results'])
    } for c in collections]
    
    conn.close()
    return jsonify(result)

@app.route('/api/collections/<int:collection_id>', methods=['GET'])
def get_collection(collection_id):
    """Get a specific collection by ID."""
    conn = get_db_connection()
    
    collection = conn.execute('''
        SELECT id, name, description, image_data, image_type,
               speed_profile, results, created_at
        FROM collections
        WHERE id = ?
    ''', (collection_id,)).fetchone()
    
    if not collection:
        return jsonify({"error": "Collection not found"}), 404
    
    result = {
        'id': collection['id'],
        'name': collection['name'],
        'description': collection['description'],
        'image_url': f"data:{collection['image_type']};base64,{collection['image_data']}" if collection['image_data'] else None,
        'created_at': collection['created_at'],
        'speed_profile': json.loads(collection['speed_profile']),
        'results': json.loads(collection['results'])
    }
    
    conn.close()
    return jsonify(result)

@app.route('/api/admin/users', methods=['GET'])
def get_users():
    # Get and verify admin credentials
    username = request.args.get('username')
    password = request.args.get('password')
    
    if not username or not password or not is_admin(username, password):
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    
    users = conn.execute('''
        SELECT u.username, u.is_admin,
               COUNT(DISTINCT c.id) as collection_count,
               MAX(c.created_at) as last_activity,
               GROUP_CONCAT(DISTINCT vt.type_name) as vehicle_types_used
        FROM users u
        LEFT JOIN collections c ON u.username = c.username
        LEFT JOIN json_each(c.results) e ON json_valid(c.results)
        LEFT JOIN vehicle_types vt ON vt.id = CAST(e.key AS INTEGER)
        GROUP BY u.username
        ORDER BY u.username ASC
    ''').fetchall()
    
    result = [{
        'username': user['username'],
        'is_admin': bool(user['is_admin']),
        'collection_count': user['collection_count'],
        'last_activity': user['last_activity'] or 'Never',
        'vehicle_types_used': user['vehicle_types_used'].split(',') if user['vehicle_types_used'] else []
    } for user in users]
    
    conn.close()
    return jsonify(result)




@app.route('/api/collections/<int:collection_id>', methods=['PUT'])
def update_collection(collection_id):
    """Update an existing collection."""
    if 'username' not in request.form:
        return jsonify({"error": "Username is required"}), 400
        
    username = request.form['username']
    name = request.form.get('name')
    description = request.form.get('description', '')
    
    if not name:
        return jsonify({"error": "Collection name is required"}), 400
        
    try:
        conn = get_db_connection()
        
        # Verify collection exists and belongs to user
        collection = conn.execute(
            'SELECT * FROM collections WHERE id = ? AND username = ?',
            (collection_id, username)
        ).fetchone()
        
        if not collection:
            return jsonify({"error": "Collection not found or unauthorized"}), 404
            
        # Handle image update if provided
        image_data = None
        image_type = None
        if 'image' in request.files:
            image_file = request.files['image']
            if image_file.filename:
                if not allowed_image(image_file.filename):
                    return jsonify({"error": "Invalid image type"}), 400
                image_data = base64.b64encode(image_file.read()).decode('utf-8')
                image_type = image_file.content_type
        
        # Update collection
        if image_data is not None:
            conn.execute('''
                UPDATE collections 
                SET name = ?, description = ?, image_data = ?, image_type = ?
                WHERE id = ? AND username = ?
            ''', (name, description, image_data, image_type, collection_id, username))
        else:
            conn.execute('''
                UPDATE collections 
                SET name = ?, description = ?
                WHERE id = ? AND username = ?
            ''', (name, description, collection_id, username))
            
        conn.commit()
        return jsonify({"message": "Collection updated successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/get_metric', methods=['GET'])
def get_metric():
    metric_id = request.args.get('id')
    if not metric_id:
        return jsonify({'error': 'Missing id parameter'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM metrics WHERE id = ?", (metric_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            result = {
                'valueKey': row[4]
            }
            return jsonify(result)
        else:
            return jsonify({'error': 'Metric not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    try:
        conn = get_db_connection()

        # Simply fetch all metrics
        metrics = conn.execute(
            'SELECT id, label, unit, color, valueKey FROM metrics'
        ).fetchall()

        if not metrics:
            return jsonify([]), 200

        return jsonify([dict(metric) for metric in metrics]), 200

    except Exception as e:
        print("Error occurred:", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

@app.route('/api/metrics', methods=['POST'])
def add_metric():
    """Add a new metric."""
    metric_name = request.form.get('metricName')
    metric_units = request.form.get('metricUnits')
    metric_key = request.form.get('metricModel')
    metric_id = metric_name.lower().replace(" ", "_")
    metric_color = "#{:06x}".format(random.randint(0, 0xFFFFFF))
    
    if not metric_name:
        return jsonify({"error": "Metric name is required"}), 400
    if not metric_units:
        return jsonify({"error": "Metric units are required"}), 400
    
    try:
        conn = get_db_connection()
        
        # Check if metric exists
        existing_metric = conn.execute(
            'SELECT * FROM metrics WHERE label = ? AND unit = ?',
            (metric_name, metric_units)
        ).fetchone()
        
        if existing_metric:
            return jsonify({"error": "Metric already exists for this user"}), 409
        
        # Insert new metric data into the database
        conn.execute(''' 
            INSERT INTO metrics (id, label, unit, color, valueKey)
            VALUES (?, ?, ?, ?, ?)
        ''', (metric_id, metric_name, metric_units, metric_color, metric_key)) 
        
        conn.commit()
        
        return jsonify({"message": "Metric added successfully"}), 201
    
    except Exception as e:
        print("Error occurred:")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/collections/<int:collection_id>', methods=['DELETE'])
def delete_collection(collection_id):
    """Delete a collection."""
    if 'username' not in request.args:
        return jsonify({"error": "Username is required"}), 400
        
    username = request.args.get('username')
    
    try:
        conn = get_db_connection()
        
        # Verify collection exists and belongs to user
        collection = conn.execute(
            'SELECT * FROM collections WHERE id = ? AND username = ?',
            (collection_id, username)
        ).fetchone()
        
        if not collection:
            return jsonify({"error": "Collection not found or unauthorized"}), 404
            
        # Delete the collection
        conn.execute('DELETE FROM collections WHERE id = ?', (collection_id,))
        conn.commit()
        
        return jsonify({"message": "Collection deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()
            
@app.route('/api/collections/<int:collection_id>/download', methods=['GET'])
def download_collection(collection_id):
    """Generate a ZIP file containing collection data with analysis for all vehicle types."""
    conn = None
    try:
        conn = get_db_connection()
        
        # Fetch collection data
        collection = conn.execute('SELECT * FROM collections WHERE id = ?', (collection_id,)).fetchone()
        
        if not collection:
            return jsonify({"error": "Collection not found"}), 404
            
        collection_data = dict(collection)
        speed_data = json.loads(collection_data['speed_profile'])
        
        # Get all vehicle types and their parameters
        vehicle_params = conn.execute('''
            SELECT vt.id, vt.type_name, vp.param_string
            FROM vehicle_types vt
            JOIN vehicle_params vp ON vt.id = vp.vehicle_type_id
            ORDER BY vt.id
        ''').fetchall()
        
        # Create in-memory ZIP file
        memory_file = io.BytesIO()
        with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
            # Add speed profile as CSV with time steps
            with io.StringIO() as csv_buffer:
                writer = csv.writer(csv_buffer)
                writer.writerow(['time_step', 'speed_kmh', 'time_s'])
                for i, speed in enumerate(speed_data):
                    writer.writerow([i, speed, i])
                zf.writestr('speed_profile.csv', csv_buffer.getvalue())
            
            # Calculate total distance
            total_distance_km = sum(speed_data) / 3600  # Convert from km/h*s to km
            total_distance_miles = total_distance_km * 0.621371
            
            # Run analysis for each vehicle type and store results
            comparison_rows = []
            
            for vehicle in vehicle_params:
                vehicle_id = vehicle['id']
                vehicle_type = vehicle['type_name']
                param_list = vehicle['param_string'].split()
                
                try:
                    results = getEnergy(vehicle_id, speed_data, param_list)
                    # Create vehicle-specific folder
                    folder = f"results/{vehicle_type}"
                    
                    # Store detailed results
                    zf.writestr(
                        f"{folder}/analysis_results.json",
                        json.dumps(results, indent=2)
                    )
                    
                    # Store time series data
                    with io.StringIO() as csv_buffer:
                        writer = csv.writer(csv_buffer)
                        writer.writerow(['time_step', 'time_s', 'speed_kmh', 'value'])
                        for i, value in enumerate(results['model']):
                            writer.writerow([i, i, speed_data[i], value])
                        zf.writestr(f"{folder}/time_series.csv", csv_buffer.getvalue())
                    
                    # Store parameters with descriptions
                    param_descriptions = [
                        "Vehicle type number", "Powertrain type", "Vehicle mass (kg)",
                        "Vehicle length (m)", "Proportion mass on tractive axle",
                        "Coefficient of friction", "Engine power (kW)", "Maximum power (kW)",
                        "Transmission efficiency", "Drag coefficient", "Frontal area (m²)",
                        "Rolling coefficient", "c1", "c2", "Pedal input",
                        "Gr1", "Gr2", "Battery efficiency", "Min SOC",
                        "Max SOC", "Initial SOC", "Motor efficiency",
                        "Regen efficiency", "SOC limit PHEV", "Battery capacity (kWh)",
                        "Auxiliary consumption (kW)", "Alpha 0", "Alpha 1",
                        "Alpha 2", "Alpha 3"
                    ]
                    
                    param_text = "Parameters for {}\n\n".format(vehicle_type)
                    param_text += "\n".join(f"{desc}: {val}" 
                                          for desc, val in zip(param_descriptions, param_list))
                    zf.writestr(f"{folder}/parameters.txt", param_text)
                    
                    # Prepare comparison data
                    comparison_row = {
                        'Vehicle Type': vehicle_type,
                        'Distance (km)': round(total_distance_km, 3),
                        'Distance (miles)': round(total_distance_miles, 3)
                    }
                    
                    # Add vehicle-specific metrics
                    if vehicle_type == 'ICEV':
                        comparison_row.update({
                            'Fuel Consumption (L)': round(results['total_fuel_liters'], 3),
                            'Fuel Economy (mpg)': round(results['total_fuel_mpg'], 2),
                            'Energy Used (kWh)': round(results['total_energy_kWh'], 3)
                        })
                    elif vehicle_type == 'BEV':
                        comparison_row.update({
                            'Energy Consumed (kWh)': round(results['EE_consumed_kWh'], 3),
                            'Energy Recovered (kWh)': round(results['EE_recovered_kWh'], 3),
                            'Final Battery SOC (%)': round(results['SOC_final_percent'], 1),
                            'Efficiency (miles/kWh)': round(results['Energy_consumed_mile_per_kWh'], 2)
                        })
                    elif vehicle_type == 'HEV':
                        comparison_row.update({
                            'Fuel Consumption (L)': round(results['total_fuel_liters'], 3),
                            'Fuel Economy (mpg)': round(results['total_fuel_mpg'], 2),
                            'Energy Used (kWh)': round(results['total_energy_kWh'], 3)
                        })
                    elif vehicle_type == 'HFCV':
                        comparison_row.update({
                            'Energy Used (kWh)': round(results['total_energy_kWh'], 3),
                            'Efficiency (miles/kWh)': round(results['total_energy_mile_per_kWh'], 2)
                        })
                    
                    comparison_rows.append(comparison_row)
                    
                except Exception as e:
                    print(f"Error analyzing {vehicle_type}: {str(e)}")
                    continue
            
            # Create comparison CSV
            if comparison_rows:
                with io.StringIO() as csv_buffer:
                    # Get all unique fields
                    fields = []
                    for row in comparison_rows:
                        for field in row.keys():
                            if field not in fields:
                                fields.append(field)
                    
                    writer = csv.DictWriter(csv_buffer, fieldnames=fields)
                    writer.writeheader()
                    writer.writerows(comparison_rows)
                    zf.writestr('vehicle_comparison.csv', csv_buffer.getvalue())
            
            # Add summary README
            readme_content = f"""Energy Analysis Results
Collection: {collection_data['name']}
Created: {collection_data['created_at']}
Description: {collection_data['description']}

Speed Profile Summary:
- Duration: {len(speed_data)} seconds
- Distance: {round(total_distance_km, 3)} km ({round(total_distance_miles, 3)} miles)
- Average Speed: {round(np.mean(speed_data), 1)} km/h
- Maximum Speed: {round(max(speed_data), 1)} km/h

Files in this archive:
1. speed_profile.csv - Original speed profile data
2. vehicle_comparison.csv - Summary comparison of all vehicle types
3. results/<vehicle_type>/ - Detailed results for each vehicle type:
   - analysis_results.json - Complete analysis results
   - time_series.csv - Time series data of energy consumption
   - parameters.txt - Vehicle parameters used in analysis

Analysis completed: {datetime.now().isoformat()}
"""
            zf.writestr('README.txt', readme_content)
        
        # Prepare the response
        memory_file.seek(0)
        
        return send_file(
            memory_file,
            mimetype='application/zip',
            as_attachment=True,
            download_name=f"{collection_data['name'].replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.zip"
        )
        
    except Exception as e:
        print(f"Error in download_collection: {str(e)}")
        return jsonify({"error": f"Error generating download: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    app.run()