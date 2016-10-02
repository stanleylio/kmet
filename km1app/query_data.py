#
# 
# Ocean Technology Group
# SOEST, University of Hawaii
# Stanley H.I. Lio
# hlio@hawaii.edu
# All Rights Reserved, 2016
from sqlalchemy import create_engine,Table,MetaData
from os.path import exists
from datetime import datetime,timedelta
import calendar,logging,sys
sys.path.append('/home/otg/node')
from helper import dt2ts,ts2dt


logging.basicConfig()


#def dt2ts(dt):
#    return calendar.timegm(dt.timetuple()) + (dt.microsecond)*(1e-6)

#def ts2dt(ts):
#    return datetime.utcfromtimestamp(ts)


dbfile = '/var/logging/data/met.db'
assert exists(dbfile)

# database stuff
engine = create_engine('sqlite:///'+dbfile,echo=False)
#meta = MetaData()
#meta.bind = engine


time_col = 'ts'

def read_time_range(table,col_list,begin,end=None):
    if end is None:
        end = dt2ts(datetime.utcnow())
    time_range = 'WHERE {time_col} BETWEEN "{begin}" AND "{end}"'.\
                 format(time_col=time_col,begin=begin,end=end)
    cmd = 'SELECT {col_list} FROM {table} {time_range} ORDER BY {time_col} DESC'.\
          format(col_list=','.join(col_list),
                 table=table,
                 time_col=time_col,
                 time_range=time_range)
    tmp = engine.execute(cmd)
    tmp = zip(*tmp)
    if (len(tmp)):
        return {v:tmp[k] for k,v in enumerate(col_list)}
    return {v:[] for k,v in enumerate(col_list)}


if '__main__' == __name__:
    table = 'PIR'
    begin = dt2ts(datetime.utcnow() - timedelta(minutes=5))
    end = None
    print(read_time_range(table,['ts','ir_mV','t_dome_V'],begin,end))

