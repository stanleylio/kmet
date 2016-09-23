# -*- coding: utf-8 -*-
import traceback
from flask import Flask,render_template,request
from km1app import app
from json import dumps
from query_data import read_time_range
from json import dumps


schema = {'PIR':['ir_mV','t_case_V','t_dome_V'],
          'PAR':['par_V'],
          'PSP':['psp_mV'],
          'PortWind':['apparent_speed_mps','apparent_direction_deg'],
          'StarboardWind':['apparent_speed_mps','apparent_direction_deg'],
          'UltrasonicWind':['apparent_speed_mps','apparent_direction_deg'],
          'OpticalRain':['weather_condition','instantaneous_mmphr','accumulation_mm'],
          'BME280':['T','P','RH']}
sensors = schema.keys()


@app.route('/')
def route_index():
    return render_template('index.html')

@app.route('/by_sensor/<sensor>/')
def by_sensor(sensor):
    m = {'PAR':'par',
         'PIR':'pir',
         'PSP':'psp',
         'UltrasonicWind':'ultrasonic',
         'PortWind':'portwind',
         'StarboardWind':'starboardwind',
         'BME280':'bmechart',
         }
    try:
        return render_template(m[sensor] + '.html')
    except:
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
    if sensor in schema.keys():
        begin = request.args.get('begin')
        end = request.args.get('end')
        col_list = ['ts']
        col_list.extend(schema[sensor])
        r = read_time_range(sensor,col_list,begin,end)
        return dumps(r,separators=(',',':'))
    else:
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
