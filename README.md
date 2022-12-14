# CS171 Final Project

## GitHub Link
https://github.com/mmfire118/CS171-final-project

## Usage
- Create `.env` file in the root directory with 2 lines: `PYTHON_VERSION=3.10.4` and `SECRET_KEY=INSERT_SECRET_KEY_HERE`
- Install requirements with `pip install -r requirements.txt`
- Run with `gunicorn --workers=1 api.application:app --timeout 180`.

## Locations of Team Code
- Most of this file is libraries that Miles installed to help host and style the website.
- The `index.html` file is located in the `api/templates` directory.
- Our primary style sheet is `api/static/assets/css/style.css`.
- The rest of the code we wrote is in the `api/static/assets/js`, excluding the .min.js files.

## Website Link
https://cs171.onrender.com/

## Link to Original Data
- The size of our original dataset was too big to upload. You can access it at the following link: https://nijianmo.github.io/amazon/index.html.
- The file explaining the fields of the data files we included is `data_fields.md`.