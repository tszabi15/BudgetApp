# app/routes.py

from flask import Blueprint, request, jsonify, current_app
from .extensions import db
from .models import User, Transaction, Role
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


def admin_required(f):
    """
    Egy dekorátor, ami ellenőrzi, hogy a felhasználó 'admin' szerepkörrel rendelkezik-e.
    MINDIG a @token_required UTÁN kell használni.
    """
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if not current_user.has_role('admin'):
            return jsonify({'error': 'Admin jogosultság szükséges ehhez a művelethez'}), 403 # 403 Forbidden

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

        default_role = Role.query.filter_by(name='user').first()
        if default_role:
            new_user.role = default_role
        else:
            return jsonify({'error': "Alapértelmezett 'user' szerepkör nem található."}), 500

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

        user_roles = [user.role.name] if user.role else []

        token_payload = {
            'user_id': user.id,
            'username': user.username,
            'roles': user_roles,
            'iat': datetime.now(timezone.utc),
            'exp': datetime.now(timezone.utc) + timedelta(hours=24)
        }
        
        token = jwt.encode(
            token_payload,
            current_app.config['SECRET_KEY'],
            algorithm='HS256'
        )

        return jsonify({
            'message': 'Sikeres bejelentkezés',
            'token': token,
            'user': { 'id': user.id, 'username': user.username, 'email': user.email, 'roles': user_roles }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/transactions', methods=['GET'])
@token_required
def get_transactions(current_user):
    """Visszaadja a bejelentkezett felhasználó összes tranzakcióját."""
    try:
        transactions = Transaction.query.filter_by(user_id=current_user.id).order_by(Transaction.date.desc()).all()
        
        output = []
        for transaction in transactions:
            output.append({
                'id': transaction.id,
                'description': transaction.description,
                'amount': transaction.amount,
                'category': transaction.category,
                'date': transaction.date.isoformat()
            })
            
        return jsonify({'transactions': output}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/transactions', methods=['POST'])
@token_required
def create_transaction(current_user):
    """Létrehoz egy új tranzakciót (egyedi dátummal)."""
    try:
        data = request.get_json()

        if not data or not data.get('description') or data.get('amount') is None:
            return jsonify({'error': 'Hiányzó adatok (description, amount szükséges)'}), 400

        transaction_date_obj = None
        date_string = data.get('date')

        if date_string:
            try:
                if date_string.endswith('Z'):
                    date_string = date_string[:-1] + '+00:00'
                transaction_date_obj = datetime.fromisoformat(date_string)
            except (ValueError, TypeError):
                return jsonify({'error': "Érvénytelen dátum formátum. ISO 8601 (pl. '2025-11-04T10:30:00Z') szükséges."}), 400
        else:
            transaction_date_obj = datetime.now(timezone.utc)

        new_transaction = Transaction(
            description=data['description'],
            amount=float(data['amount']),
            category=data.get('category', 'Egyéb'),
            date=transaction_date_obj,
            user_id=current_user.id
        )
        
        db.session.add(new_transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Tranzakció sikeresen létrehozva',
            'transaction': {
                'id': new_transaction.id,
                'description': new_transaction.description,
                'amount': new_transaction.amount,
                'category': new_transaction.category,
                'date': new_transaction.date.isoformat()
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/transactions/<int:id>', methods=['PUT'])
@token_required
def update_transaction(current_user, id):
    """Frissít egy meglévő tranzakciót (egyedi dátummal)."""
    try:
        transaction = Transaction.query.get(id)

        if not transaction:
            return jsonify({'error': 'Tranzakció nem található'}), 404

        if transaction.user_id != current_user.id and not current_user.has_role('admin'):
            return jsonify({'error': 'Nincs jogosultsága ehhez a művelethez'}), 403

        data = request.get_json()
        if not data:
            return jsonify({'error': 'Hiányzó adatok'}), 400

        transaction.description = data.get('description', transaction.description)
        transaction.amount = float(data.get('amount', transaction.amount))
        transaction.category = data.get('category', transaction.category)
        
        date_string = data.get('date')
        if date_string:
            try:
                if date_string.endswith('Z'):
                    date_string = date_string[:-1] + '+00:00'
                transaction.date = datetime.fromisoformat(date_string)
            except (ValueError, TypeError):
                return jsonify({'error': "Érvénytelen dátum formátum."}), 400

        db.session.commit()

        return jsonify({
            'message': 'Tranzakció sikeresen frissítve',
            'transaction': {
                'id': transaction.id,
                'description': transaction.description,
                'amount': transaction.amount,
                'category': transaction.category,
                'date': transaction.date.isoformat()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/transactions/<int:id>', methods=['DELETE'])
@token_required
def delete_transaction(current_user, id):
    """Töröl egy tranzakciót."""
    try:
        transaction = Transaction.query.get(id)

        if not transaction:
            return jsonify({'error': 'Tranzakció nem található'}), 404
            
        if transaction.user_id != current_user.id and not current_user.has_role('admin'):
            return jsonify({'error': 'Nincs jogosultsága ehhez a művelethez'}), 403

        db.session.delete(transaction)
        db.session.commit()
        
        return jsonify({'message': 'Tranzakció sikeresen törölve'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/transactions/all', methods=['GET'])
@token_required
@admin_required
def get_all_transactions(current_user):
    """(Csak Admin) Visszaadja az ÖSSZES tranzakciót a rendszerben."""
    
    try:
        transactions = Transaction.query.order_by(Transaction.date.desc()).all()
        
        output = []
        for transaction in transactions:
            output.append({
                'id': transaction.id,
                'description': transaction.description,
                'amount': transaction.amount,
                'category': transaction.category,
                'date': transaction.date.isoformat(),
                'user_id': transaction.user_id
            })
            
        return jsonify({'all_transactions': output}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500