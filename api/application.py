from curses import keyname
import os
import json
import bson
import uuid
import string
import random
import re
import redis
import base64
import pyotp
import secrets
import requests

from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from flask import (
    Flask,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    abort,
    current_app,
    make_response,
    get_flashed_messages,
    url_for,
    Response,
)
from flask_cors import CORS, cross_origin
from flask_talisman import Talisman
from werkzeug.exceptions import default_exceptions, HTTPException, InternalServerError
from werkzeug.security import check_password_hash, generate_password_hash
from requests.exceptions import HTTPError
from random import randint
from itsdangerous.url_safe import URLSafeTimedSerializer
from marshmallow import fields, Schema, validate
from bson.objectid import ObjectId
from flask_seasurf import SeaSurf

PRODUCTION = not os.path.exists(".env")

if not PRODUCTION:
    from dotenv import load_dotenv

    load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ["SECRET_KEY"]

CORS(app)

SELF = "'self'"
talisman = Talisman(
    app,
    content_security_policy={
        "default-src": [
            SELF,
            "stackpath.bootstrapcdn.com",
        ],
        "font-src": [
            SELF,
            "fonts.gstatic.com",
        ],
        "img-src": [SELF, "data:", "t3.gstatic.com"],
        "style-src": [
            SELF,
            "stackpath.bootstrapcdn.com",
            "fonts.googleapis.com",
            "'unsafe-inline'",
        ],
        "script-src": [
            SELF,
            "stackpath.bootstrapcdn.com",
            "'unsafe-inline'",
            "'unsafe-eval'"
        ],
    },
)

# App Config + Ensure Templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["SESSION_COOKIE_SECURE"] = True
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["CSRF_COOKIE_SECURE"] = True
app.config["CSRF_COOKIE_HTTPONLY"] = True
app.config["SEASURF_INCLUDE_OR_EXEMPT_VIEWS"] = "exempt"
app.config["SESSION_COOKIE_SECURE"] = True
app.config["SESSION_COOKIE_HTTPONLY"] = True

csrf = SeaSurf(app)

# Ensure responses aren't cached
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

@app.route("/")
def index():
    return render_template("index.html")


if PRODUCTION:
    if __name__ == "__main__":
        app.run(debug=False)
else:
    app.run(debug=False, ssl_context="adhoc")


def apology(message, code=400):
    return json.dumps({"message": message}), code


def errorhandler(e):
    if not isinstance(e, HTTPException):
        e = InternalServerError()
    return apology(e.name, e.code)


# Listen for errors
for code in default_exceptions:
    app.errorhandler(code)(errorhandler)
