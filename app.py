from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import hashlib

app = Flask(__name__)
CORS(app)

USER_DATA_FILE = "users.json"

# Load users from JSON file
def load_users():
    if not os.path.exists(USER_DATA_FILE):
        return {}
    
    try:
        with open(USER_DATA_FILE, "r") as file:
            data = file.read().strip()
            return json.loads(data) if data else {}
    except json.JSONDecodeError:
        print("Error: Invalid JSON format. Resetting users.json.")
        save_users({})
        return {}

# Save users to JSON file
def save_users(users):
    with open(USER_DATA_FILE, "w") as file:
        json.dump(users, file, indent=4)

# Hash function for password security
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required"}), 400

    users = load_users()

    if email in users:
        return jsonify({"success": False, "message": "Account already exists"}), 409

    users[email] = {"password": hash_password(password)}
    save_users(users)

    return jsonify({"success": True, "message": "Signup successful. Please login."}), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required"}), 400

    users = load_users()

    if email not in users:
        return jsonify({"success": False, "message": "Account does not exist"}), 404

    if users[email]["password"] != hash_password(password):
        return jsonify({"success": False, "message": "Invalid password"}), 401

    return jsonify({"success": True, "message": "Login successful"}), 200

if __name__ == "__main__":
    app.run(debug=True)