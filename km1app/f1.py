# -*- coding: utf-8 -*-
import traceback
from flask import Flask,render_template,request
from km1app import app
from json import dumps
from query_data import read_time_range
from json import dumps

import sys,traceback,logging
sys.path.append(r'/home/otg/logging')
import db_configuration as dbconfig


logging.basicConfig(level=logging.DEBUG)


@app.route('/')
def route_index():
    return render_template('index.html')

@app.route('/by_sensor/<sensor>/')
def by_sensor(sensor):
    if sensor in dbconfig.get_list_of_sensors():
        try:
            return render_template(sensor + '.html')
        except:
            logging.debug(traceback.format_exc())
    return "it's beyond my paygrade"

@app.route('/by_variable/<variable>/')
def by_variable(variable):
    m = {'apparent_wind_polar':'windpolar',
         'apparent_wind_graph':'windchart',
         }
    try:
        return render_template(m[variable] + '.html')
    except:
        return "everyone's got a mortgage"

@app.route('/data/1/<sensor>.json')
def data1(sensor):
    if sensor in dbconfig.get_list_of_sensors():
        try:
            begin = request.args.get('begin')
            end = request.args.get('end')
            col_list = ['ts']
            #col_list.extend(schema[sensor])
            col_list.extend(dbconfig.get_list_of_variables(sensor))
            r = read_time_range(sensor,col_list,begin,end)
            return dumps(r,separators=(',',':'))
        except:
            logging.debug(traceback.format_exc())
    return 'too low on the totem pole'

@app.route('/meta/')
def meta():
    return render_template('meta.html')

@app.route('/info/')
def info():
    return render_template('info.html')

@app.route('/faq/')
def faq():
    return render_template('faq.html')

@app.route('/about/')
def about():
    return render_template('about.html')

@app.route('/processing/')
def processing():
    return render_template('processing.html')
