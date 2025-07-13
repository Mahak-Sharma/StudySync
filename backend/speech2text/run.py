from app import create_app

app = create_app()

if __name__ == '__main__':
<<<<<<< HEAD
    app.run(debug=True)
=======
    app.run(debug=True, host='0.0.0.0', port=5000)
>>>>>>> 4ac216657b6331e49fad08bc5c18de19114ff827
