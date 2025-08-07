# coding: utf-8

import csv
import json


def shape_date_string (date_string):
    return date_string[0:4] + "-" + date_string[4:6] + "-" + date_string[6:8]


def conv_diagram_info (mes, main_dir, diagram_revision):
    mes("ダイヤ情報ファイルの変換", is_heading=True)
    
    mes("calendar.txtを読み込んでいます...")
    with open(main_dir + "/" + diagram_revision + "/calendar.txt", "r", encoding="utf-8-sig") as csv_f:
        dict_reader = csv.DictReader(csv_f)
        calendar = [data_row for data_row in dict_reader]
    
    mes("calendar_dates.txtを読み込んでいます...")
    with open(main_dir + "/" + diagram_revision + "/calendar_dates.txt", "r", encoding="utf-8-sig") as csv_f:
        dict_reader = csv.DictReader(csv_f)
        calendar_dates = [data_row for data_row in dict_reader]
    
    mes("データを変換しています...")
    
    diagram_info = {"services" : {}, "service_order" : [], "calendar" : [], "calendar_dates" : {}}
    
    for service_info in calendar:
        diagram_info["calendar"].append({ "service_id" : service_info["service_id"] , "start_date" : shape_date_string(service_info["start_date"]), "end_date" : shape_date_string(service_info["end_date"]), "implementation_days" : [int(service_info["sunday"]), int(service_info["monday"]), int(service_info["tuesday"]), int(service_info["wednesday"]), int(service_info["thursday"]), int(service_info["friday"]), int(service_info["saturday"])] })
        diagram_info["service_order"].append(service_info["service_id"])
    
    for calendar_date in calendar_dates:
        if int(calendar_date["exception_type"]) == 2:
            continue
        
        diagram_info["calendar_dates"][shape_date_string(calendar_date["date"])] = calendar_date["service_id"]
        
        if calendar_date["service_id"] not in diagram_info["service_order"]:
            diagram_info["service_order"].append(calendar_date["service_id"])
    
    for service_id in diagram_info["service_order"]:
        diagram_info["services"][service_id] = { "service_name" : "名称未設定ダイヤ", "main_color" : "#cccccc" }
    
    mes("diagram_info.jsonに保存しています...")
    with open(main_dir + "/" + diagram_revision + "/diagram_info.json", "w", encoding="utf-8-sig") as json_f:
        json.dump(diagram_info, json_f, ensure_ascii=False, indent=4)
    
    mes("処理が完了しました")
