# -*- coding: utf-8 -*-
import traceback
from flask import Flask,render_template,request
from km1app import app
from json import dumps


@app.route('/')
def route_index():
    return render_template('index.html')

@app.route('/plot/')
def plot():
    return render_template('bmechart.html')

@app.route('/by_sensor/bme280/')
def by_sensor_bme280():
    return render_template('bmechart.html')

@app.route('/info/')
def info():
    return render_template('info.html')

@app.route('/about/')
def about():
    return render_template('about.html')

@app.route('/processing/')
def processing():
    return render_template('processing.html')

