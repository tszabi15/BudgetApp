from flask import Blueprint, request, jsonify, current_app
from .extensions import db
from .models import User
import jwt
from datetime import datetime, timezone, timedelta

api_bp = Blueprint('api', __name__)


@api_bp.route('/register', methods=['POST'])
def register():
    """Új felhasználó regisztrálása."""
    try:
        data = request.get_json()

        if not data or not data.get('email') or not data.get('password') or not data.get('username'):
            return jsonify({'error': 'Hiányzó adatok (email, username, password szükséges)'}), 400

        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Ez az email cím már foglalt'}), 409
            
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Ez a felhasználónév már foglalt'}), 409

        new_user = User(
            username=data['username'],
            email=data['email']
        )
        new_user.set_password(data['password'])

        # Mentés az adatbázisba
        db.session.add(new_user)
        db.session.commit()

        return jsonify({'message': 'Sikeres regisztráció'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500