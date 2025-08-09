# coding: utf-8

import json
import sqlite3

from modules import diagram_funcs

def generate_operation_table (mes, main_dir, date_string):
    mes("運用表の生成", is_heading=True)
    
    diagram = diagram_funcs.diagram(main_dir, mes=mes)
    
    diagram_revision, service_id = diagram.get_service_id(date_string)
    
    if service_id is None:
        mes("指定された日付に該当するダイヤを判別できませんでした", True)
        return False
    
    mes("route_info.jsonを読み込んでいます...")
    with open(main_dir + "/" + diagram_revision + "/route_info.json", "r", encoding="utf-8-sig") as json_f:
        route_info = json.load(json_f)
    
    mes("timetable_" + service_id + ".jsonを読み込んでいます...")
    with open(main_dir + "/" + diagram_revision + "/timetable_" + service_id + ".json", "r", encoding="utf-8-sig") as json_f:
        timetable = json.load(json_f)
    
    mes("データベースに接続しています...")
    conn = sqlite3.connect(main_dir + "/operation_data.db")
    cur = conn.cursor()
    
    mes("車両運行履歴を抽出しています...")
    cur.execute("SELECT `vehicle_name`, `trip_id` FROM `busrun_operation_logs` WHERE `operation_date` = :operation_date", {"operation_date" : date_string})
    
    operation_logs = {}
    
    for log_data in cur.fetchall():
        if log_data[0] not in operation_logs:
            operation_logs[log_data[0]] = {}
        
        operation_logs[log_data[0]][timetable[log_data[1]]["departure_times"][0]] = log_data[1]
    
    mes("データを整理しています...")
    
    operations = {}
    operation_ids = {}
    
    for vehicle_name in operation_logs.keys():
        departure_times = sorted(operation_logs[vehicle_name].keys())
        
        operation_id = operation_logs[vehicle_name][departure_times[0]]
        operation_ids[departure_times[0] + "_" + operation_id] = operation_id
        operations[operation_id] = { "trips" : [], "starting_time" : departure_times[0], "ending_time" : timetable[operation_logs[vehicle_name][departure_times[-1]]]["departure_times"][-1] }
        
        for departure_time in departure_times:
            trip_id = operation_logs[vehicle_name][departure_time]
            route_stops = route_info["routes"][timetable[trip_id]["route_id"]]["stops"]
            
            if int(timetable[trip_id]["direction_id"]):
                route_stops.reverse()
            
            operations[operation_id]["trips"].append({ "trip_id" : trip_id, "first_departure_time" : departure_time, "final_arrival_time" : timetable[trip_id]["departure_times"][-1], "starting_stop" : route_stops[0]["stop_id"], "terminal_stop" : route_stops[-1]["stop_id"] })
    
    operation_order = []
    
    for departure_time_key in sorted(operation_ids.keys()):
        operation_order.append(operation_ids[departure_time_key])
    
    operation_table_file_name = "operation_table_" + service_id + ".json"
    
    mes(operation_table_file_name + "に保存しています...")
    
    with open(main_dir + "/" + diagram_revision + "/" + operation_table_file_name, "w", encoding="utf-8-sig") as json_f:
        json.dump({ "operations" : operations, "operation_order" : operation_order }, json_f, ensure_ascii=False, separators=(',', ':'))
    
    mes("運用表をデータベースに登録しています...")
    
    cur.execute("DELETE FROM `busrun_trips` WHERE `diagram_revision` = :diagram_revision AND `service_id` = :service_id", {"diagram_revision" : diagram_revision, "service_id" : service_id})
    
    for operation_id in operations.keys():
        for trip in operations[operation_id]["trips"]:
            cur.execute("INSERT INTO `busrun_trips`(`diagram_revision`, `service_id`, `operation_id`, `trip_id`) VALUES (:diagram_revision, :service_id, :operation_id, :trip_id)", {"diagram_revision" : diagram_revision, "service_id" : service_id, "operation_id" : operation_id, "trip_id" : trip["trip_id"]})
    
    conn.commit()
    conn.close()
    
    mes("処理が完了しました")
