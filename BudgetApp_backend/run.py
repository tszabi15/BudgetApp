from app import create_app
from app.extensions import db
from app.models import Role

app = create_app()

def setup_database(app):
    with app.app_context():
        db.create_all()
        
        user_role = Role.query.filter_by(name='user').first()
        admin_role = Role.query.filter_by(name='admin').first()

        if not user_role:
            db.session.add(Role(name='user'))
            print("Created 'user' role.")
        
        if not admin_role:
            db.session.add(Role(name='admin'))
            print("Created 'admin' role.")
            
        db.session.commit()

if __name__ == '__main__':
    setup_database(app)
        
    app.run(debug=True, port=5000)