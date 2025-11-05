import os
from flask import Flask
from .extensions import db, bcrypt, cors
from .models import User, Transaction
from .routes import api_bp

def create_app():
    app = Flask(__name__)

    cors.init_app(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, '..', 'database.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    app.config['SECRET_KEY'] = 'e76620c3772613d0be845166bc38173409ac529b55ee3c11'

    db.init_app(app)
    bcrypt.init_app(app)

    app.register_blueprint(api_bp, url_prefix='/api')

    return app