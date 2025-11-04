from flask import Blueprint, request, jsonify, current_app
from .extensions import db
from .models import User, Transaction
import jwt
from datetime import datetime, timezone, timedelta
from functools import wraps

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Hibás token formátum'}), 401

        if not token:
            return jsonify({'error': 'Hiányzó token'}), 401

        try:
            data = jwt.decode(
                token, 
                current_app.config['SECRET_KEY'], 
                algorithms=['HS256']
            )
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'Felhasználó nem található'}), 404
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'A token lejárt'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Érvénytelen token'}), 401
        except Exception as e:
            return jsonify({'error': 'Hiba a token feldolgozása közben', 'details': str(e)}), 500

        return f(current_user, *args, **kwargs)

    return decorated


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

        db.session.add(new_user)
        db.session.commit()

        return jsonify({'message': 'Sikeres regisztráció'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@api_bp.route('/login', methods=['POST'])
def login():
    """Felhasználó bejelentkeztetése és JWT token generálása."""
    try:
        data = request.get_json()

        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Hiányzó adatok (email, password szükséges)'}), 400

        user = User.query.filter_by(email=data['email']).first()

        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Hibás email cím vagy jelszó'}), 401

        token_payload = {
            'user_id': user.id,
            'username': user.username,
            'iat': datetime.now(timezone.utc),
            'exp': datetime.now(timezone.utc) + timedelta(hours=24) #
        }
        
        token = jwt.encode(
            token_payload,
            current_app.config['SECRET_KEY'],
            algorithm='HS256'
        )

        return jsonify({
            'message': 'Sikeres bejelentkezés',
            'token': token,
            'user': { 'id': user.id, 'username': user.username, 'email': user.email }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500