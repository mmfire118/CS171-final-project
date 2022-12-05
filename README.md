# CS171 Final Project

## Usage
- Create `.env` file in the root directory with 2 lines: `PYTHON_VERSION=3.10.4` and `SECRET_KEY=INSERT_SECRET_KEY_HERE`
- Install requirements with `pip install -r requirements.txt`
- Run with `gunicorn --workers=1 api.application:app --timeout 180`.

## Link to Original Data
- The size of our original dataset was too big to upload. You can access it at the following link: https://nijianmo.github.io/amazon/index.html.