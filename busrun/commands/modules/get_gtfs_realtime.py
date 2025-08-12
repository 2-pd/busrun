# coding: utf-8

import traceback
import time
import random
import urllib.request
import json
import sqlite3

from google.protobuf.json_format import MessageToDict

from modules import gtfs_realtime_pb2
from modules import diagram_funcs


def do_nothing (*args):
    pass


def get_agency_gtfs_realtime (mes, main_dir, url):
    diagram = diagram_funcs.diagram(main_dir, mes=mes)
    
    mes(url + " に接続します...")
    
    operation_date = diagram.get_date_string()
    
    feed_mes = gtfs_realtime_pb2.FeedMessage()
    
    
    try:
        with urllib.request.urlopen(urllib.request.Request(url), timeout=10) as response:
            feed_mes.ParseFromString(response.read())
    except urllib.error.HTTPError as err:
        mes("サーバがエラーコード " + str(err.code) + " を返しました", True)
        return False
    except urllib.error.URLError:
        mes("サーバに接続できませんでした", True)
        return False
    except Exception:
        mes(traceback.format_exc(), True)
        return False
    
    
    feed_dict = MessageToDict(feed_mes)
    
    if "entity" not in feed_dict:
        mes("走行中の車両の情報がありません")
        return True
    
    
    mes("取得したデータを保存しています...")
    
    try:
        with open(main_dir + "/gtfs_realtime_cache.json", "w", encoding="utf-8-sig") as json_f:
            json.dump(feed_dict, json_f, ensure_ascii=False, separators=(',', ':'))
    except PermissionError:
        mes("gtfs_realtime_cache.jsonの書き込み権限がありません", True)
    except:
        mes("gtfs_realtime_cache.jsonの作成に失敗しました", True)
    
    
    mes("取得したデータをデータベースに記録しています...")
    
    diagram_revision = diagram.get_diagram_revision(operation_date)
    now_datetime = time.strftime("%Y-%m-%d %H:%M:%S")
    
    try:
        conn = sqlite3.connect(main_dir + "/operation_data.db")
        cur = conn.cursor()
        
        cur.execute("SELECT `operation_id`, `assign_order`, `vehicle_name`, `latest_trip_sequence`, `change_datetime` FROM `busrun_data` WHERE `operation_date` = :operation_date ORDER BY `operation_id` ASC, `assign_order` DESC", {"operation_date" : operation_date})
    
        operation_data = {}
        
        for data_item in cur.fetchall():
            if data_item[0] in operation_data:
                continue
            
            operation_data[data_item[0]] = { "assign_order" : data_item[1], "vehicle_name" : data_item[2], "latest_trip_sequence" : data_item[3], "change_datetime" : data_item[4] }
        
        for trip_data in feed_dict["entity"]:
            trip_id = trip_data["tripUpdate"]["trip"]["tripId"]
            vehicle_name = trip_data["tripUpdate"]["vehicle"]["label"]
            
            cur.execute("REPLACE INTO `busrun_operation_logs`(`operation_date`, `trip_id`, `vehicle_name`) VALUES (:operation_date, :trip_id, :vehicle_name)", {"operation_date" : operation_date, "trip_id" : trip_data["tripUpdate"]["trip"]["tripId"], "vehicle_name" : trip_data["tripUpdate"]["vehicle"]["label"]})
            
            if diagram_revision is None:
                continue
            
            cur.execute("SELECT `operation_id`, `trip_sequence` FROM `busrun_trips` WHERE `diagram_revision` = :diagram_revision AND `trip_id` = :trip_id", {"diagram_revision" : diagram_revision, "trip_id" : trip_data["tripUpdate"]["trip"]["tripId"]})
            
            trip_info = cur.fetchone()
            if trip_info is None:
                continue
            
            if trip_info[0] in operation_data:
                if trip_info[1] <= operation_data[trip_info[0]]["latest_trip_sequence"]:
                    continue
                
                if trip_data["tripUpdate"]["vehicle"]["label"] == operation_data[trip_info[0]]["vehicle_name"]:
                    assign_order = operation_data[trip_info[0]]["assign_order"]
                    change_datetime = operation_data[trip_info[0]]["change_datetime"]
                else:
                    assign_order = operation_data[trip_info[0]]["assign_order"] + 1
                    change_datetime = now_datetime
                    
                    cur.execute("UPDATE `busrun_data` SET `change_datetime` = :change_datetime WHERE `operation_date` = :operation_date AND `operation_id` = :operation_id", {"change_datetime" : change_datetime, "operation_date" : operation_date, "operation_id" : trip_info[0]})
            else:
                assign_order = 1
                change_datetime = now_datetime
            
            cur.execute("REPLACE INTO `busrun_data`(`operation_date`, `operation_id`, `assign_order`, `vehicle_name`, `latest_trip_sequence`, `change_datetime`) VALUES (:operation_date, :operation_id, :assign_order, :vehicle_name, :latest_trip_sequence, :change_datetime)", {"operation_date" : operation_date, "operation_id" : trip_info[0], "assign_order" : assign_order, "vehicle_name" : trip_data["tripUpdate"]["vehicle"]["label"], "latest_trip_sequence" : trip_info[1], "change_datetime" : change_datetime})
        
        conn.commit()
        conn.close()
    except:
        mes("データベースへの記録に失敗しました", True)
        mes(traceback.format_exc())
    else:
        mes("データベースへの記録が完了しました")
    
    
    return True


def get_gtfs_realtime (mes, agency_id=None, options=set()):
    if "-s" in options:
        time.sleep(random.randint(11,50))
    else:
        mes("運行情報データの取得", is_heading=True)
    
    with open("../config/gtfs_realtime_endpoints.json", "r", encoding="utf-8-sig") as json_f:
        endpoints = json.load(json_f)
    
    if agency_id is None:
        agency_ids = endpoints.keys()
    else:
        agency_ids = [agency_id]
    
    for id_str in agency_ids:
        if "-s" in options:
            get_agency_gtfs_realtime(do_nothing, "../data/" + id_str, endpoints[id_str])
        else:
            get_agency_gtfs_realtime(mes, "../data/" + id_str, endpoints[id_str])
    
    if "-s" not in options:
        mes("全ての処理が完了しました")
