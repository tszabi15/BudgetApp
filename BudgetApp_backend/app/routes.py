from flask import Blueprint, request, jsonify, current_app
from .extensions import db
from .models import User, Transaction, Role
import jwt
from datetime import datetime, timezone, timedelta
from functools import wraps
from sqlalchemy import func, case, extract
from datetime import datetime


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format.'}), 401

        if not token:
            return jsonify({'error': 'Missing token'}), 401

        try:
            data = jwt.decode(
                token, 
                current_app.config['SECRET_KEY'], 
                algorithms=['HS256']
            )
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'User not found.'}), 404
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token.'}), 401
        except Exception as e:
            return jsonify({'error': 'Token error', 'details': str(e)}), 500

        return f(current_user, *args, **kwargs)

    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if not current_user.has_role('admin'):
            return jsonify({'error': 'Admin role required.'}), 403

        return f(current_user, *args, **kwargs)

    return decorated


api_bp = Blueprint('api', __name__)


@api_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        if not data or not data.get('email') or not data.get('password') or not data.get('username'):
            return jsonify({'error': 'Missing data (email, username, password required)'}), 400

        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email taken.'}), 409
            
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username taken.'}), 409

        new_user = User(
            username=data['username'],
            email=data['email']
        )
        new_user.set_password(data['password'])

        default_role = Role.query.filter_by(name='user').first()
        if default_role:
            new_user.role = default_role
        else:
            return jsonify({'error': "Default 'user' role not found."}), 500

        db.session.add(new_user)
        db.session.commit()

        return jsonify({'message': 'Successful registration.'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Missing credentials (email, password required)'}), 400

        user = User.query.filter_by(email=data['email']).first()

        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password.'}), 401

        user_roles = [user.role.name] if user.role else []

        token_payload = {
            'user_id': user.id,
            'username': user.username,
            'roles': user_roles,
            'iat': datetime.now(timezone.utc),
            'exp': datetime.now(timezone.utc) + timedelta(hours=24),
            'currency': user.currency
        }
        
        token = jwt.encode(
            token_payload,
            current_app.config['SECRET_KEY'],
            algorithm='HS256'
        )

        return jsonify({
            'message': 'Successful login.',
            'token': token,
            'user': { 'id': user.id, 'username': user.username, 'email': user.email, 'roles': user_roles }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@api_bp.route('/profile/settings', methods=['PUT'])
@token_required
def update_settings(current_user):
    try:
        data = request.get_json()
        new_currency = data.get('currency')

        if not new_currency or len(new_currency) != 3:
            return jsonify({'error': 'Invalid currency code. Must be 3 letters.'}), 400

        current_user.currency = new_currency.upper()
        db.session.commit()
        
        user_roles = [current_user.role.name] if current_user.role else []
        return jsonify({
            'message': 'Settings updated successfully',
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'email': current_user.email,
                'roles': user_roles,
                'currency': current_user.currency
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/categories', methods=['GET'])
@token_required
def get_categories(current_user):
    try:
        category_tuples = db.session.query(Transaction.category)\
            .filter_by(user_id=current_user.id)\
            .distinct()\
            .all()
        
        categories = [category[0] for category in category_tuples if category[0]]
        
        return jsonify({'categories': categories}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/transactions', methods=['GET'])
@token_required
def get_transactions(current_user):

    try:
        search_term = request.args.get('search')
        category_filter = request.args.get('category')

        query = Transaction.query.filter_by(user_id=current_user.id)

        if search_term:
            query = query.filter(Transaction.description.ilike(f'%{search_term}%'))

        if category_filter:
            query = query.filter_by(category=category_filter)

        transactions = query.order_by(Transaction.date.desc()).all()
        
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
    try:
        data = request.get_json()

        if not data or not data.get('description') or data.get('amount') is None:
            return jsonify({'error': 'Missing data (description, amount required)'}), 400

        transaction_date_obj = None
        date_string = data.get('date')

        if date_string:
            try:
                if date_string.endswith('Z'):
                    date_string = date_string[:-1] + '+00:00'
                transaction_date_obj = datetime.fromisoformat(date_string)
            except (ValueError, TypeError):
                return jsonify({'error': "Invalid date format. ISO 8601 (ec. '2025-11-04T10:30:00Z') required."}), 400
        else:
            transaction_date_obj = datetime.now(timezone.utc)

        new_transaction = Transaction(
            description=data['description'],
            amount=float(data['amount']),
            category=data.get('category', 'Other'),
            date=transaction_date_obj,
            user_id=current_user.id
        )
        
        db.session.add(new_transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Transaction has been created.',
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
    try:
        transaction = Transaction.query.get(id)

        if not transaction:
            return jsonify({'error': 'Transaction not found.'}), 404

        if transaction.user_id != current_user.id and not current_user.has_role('admin'):
            return jsonify({'error': 'Do not have permission for this.'}), 403

        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing data'}), 400

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
                return jsonify({'error': "Invalid date format."}), 400

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
    try:
        transaction = Transaction.query.get(id)

        if not transaction:
            return jsonify({'error': 'Transaction not found.'}), 404
            
        if transaction.user_id != current_user.id and not current_user.has_role('admin'):
            return jsonify({'error': 'Do not have permission for this.'}), 403

        db.session.delete(transaction)
        db.session.commit()
        
        return jsonify({'message': 'Transaction has been successfully removed.'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/transactions/all', methods=['GET'])
@token_required
@admin_required
def get_all_transactions(current_user):

    try:
        transactions = db.session.query(
            Transaction, 
            User.currency, 
            User.username
        )\
        .join(User, Transaction.user_id == User.id)\
        .order_by(Transaction.date.desc())\
        .all()
        
        output = []
        for transaction_obj, currency, username in transactions:
            output.append({
                'id': transaction_obj.id,
                'description': transaction_obj.description,
                'amount': transaction_obj.amount,
                'category': transaction_obj.category,
                'date': transaction_obj.date.isoformat(),
                'user_id': transaction_obj.user_id,
                'username': username,
                'currency': currency
            })
            
        return jsonify({'all_transactions': output}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@api_bp.route('/roles', methods=['GET'])
@token_required
@admin_required
def get_all_roles(current_user):
    try:
        roles = Role.query.all()
        return jsonify({'roles': [role.name for role in roles]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/admin/users', methods=['GET'])
@token_required
@admin_required
def get_all_users(current_user):
    try:
        users = User.query.all()
        output = []
        for user in users:
            output.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'currency': user.currency,
                'role': user.role.name if user.role else None
            })
        return jsonify({'users': output}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/admin/users/<int:id>', methods=['PUT'])
@token_required
@admin_required
def update_user(current_user, id):
    try:
        user = User.query.get(id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        
        user.username = data.get('username', user.username)
        user.email = data.get('email', user.email)
        
        role_name = data.get('role')
        if role_name:
            new_role = Role.query.filter_by(name=role_name).first()
            if not new_role:
                return jsonify({'error': 'Invalid role'}), 400
            user.role = new_role
            
        db.session.commit()
        return jsonify({'message': 'User updated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/admin/users/<int:id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(current_user, id):
    try:
        if current_user.id == id:
            return jsonify({'error': 'You cannot delete yourself.'}), 403
            
        user = User.query.get(id)
        if not user:
            return jsonify({'error': 'User not found.'}), 404

        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User has been removed.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@api_bp.route('/stats', methods=['GET'])
@token_required
def get_stats(current_user):
    try:
        now = datetime.now()
        month = request.args.get('month', default=now.month, type=int) 
        year = request.args.get('year', default=now.year, type=int)

        query_base = db.session.query(
            func.sum(case((Transaction.amount > 0, Transaction.amount), else_=0)).label('total_income'),
            func.sum(case((Transaction.amount < 0, Transaction.amount), else_=0)).label('total_expense'),
            
            func.count(Transaction.id).label('total_transactions'),
            
            func.max(case((Transaction.amount > 0, Transaction.amount), else_=0)).label('biggest_income'),
            
            func.min(case((Transaction.amount < 0, Transaction.amount), else_=0)).label('biggest_expense'),
            
            func.avg(case((Transaction.amount < 0, Transaction.amount), else_=None)).label('average_expense')
            
        ).filter(
            Transaction.user_id == current_user.id,
            extract('year', Transaction.date) == year
        )

        if month != 0:
            query_base = query_base.filter(extract('month', Transaction.date) == month)
        
        stats = query_base.one()

        income = stats.total_income or 0
        expense = stats.total_expense or 0
        net = income + expense
        
        return jsonify({
            'total_income': income,
            'total_expense': expense,
            'net_balance': net,
            'total_transactions': stats.total_transactions or 0,
            'biggest_income': stats.biggest_income or 0,
            'biggest_expense': stats.biggest_expense or 0,
            'average_expense': stats.average_expense or 0,
            'month': month,
            'year': year
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500