# coding: utf-8

import csv
import json


def conv_timetables (mes, main_dir, diagram_revision):
    mes("系統・停留所情報ファイルと時刻表の変換", is_heading=True)
    
    
    mes("stops.txtを読み込んでいます...")
    with open(main_dir + "/" + diagram_revision + "/stops.txt", "r", encoding="utf-8-sig") as csv_f:
        dict_reader = csv.DictReader(csv_f)
        stops = [data_row for data_row in dict_reader]
    
    mes("routes.txtを読み込んでいます...")
    with open(main_dir + "/" + diagram_revision + "/routes.txt", "r", encoding="utf-8-sig") as csv_f:
        dict_reader = csv.DictReader(csv_f)
        routes = [data_row for data_row in dict_reader]
    
    mes("translations.txtを読み込んでいます...")
    with open(main_dir + "/" + diagram_revision + "/translations.txt", "r", encoding="utf-8-sig") as csv_f:
        dict_reader = csv.DictReader(csv_f)
        translations = [data_row for data_row in dict_reader]
    
    mes("trips.txtを読み込んでいます...")
    with open(main_dir + "/" + diagram_revision + "/trips.txt", "r", encoding="utf-8-sig") as csv_f:
        dict_reader = csv.DictReader(csv_f)
        trips = [data_row for data_row in dict_reader]
    
    mes("stop_times.txtを読み込んでいます...")
    with open(main_dir + "/" + diagram_revision + "/stop_times.txt", "r", encoding="utf-8-sig") as csv_f:
        dict_reader = csv.DictReader(csv_f)
        stop_times = [data_row for data_row in dict_reader]
    
    
    mes("読み仮名情報を整理しています...")
    
    translation_data = {}
    
    katakana = "".join(chr(i) for i in range(0x30A1, 0x30F7))
    hiragana = "".join(chr(i) for i in range(0x3041, 0x3097))
    katakana_to_hiragana = str.maketrans(katakana, hiragana)
    
    for translation in translations:
        if translation["trans_id"] not in translation_data:
            translation_data[translation["trans_id"]] = {}
        
        if translation["lang"] == "ja-Hrkt":
            translation_data[translation["trans_id"]][translation["lang"]] = translation["translation"].translate(katakana_to_hiragana)
        else:
            translation_data[translation["trans_id"]][translation["lang"]] = translation["translation"]
    
    
    mes("停留所情報を変換しています...")
    
    stop_info = { "stops" : {}, "major_stops" : [] }
    route_info = {}
    parent_stations = {}
    
    for stop_data in stops:
        if int(stop_data["location_type"]):
            if stop_data["stop_id"] not in stop_info["stops"]:
                stop_info["stops"][stop_data["stop_id"]] = { "stop_name" : stop_data["stop_name"], "stop_name_kana" : translation_data[stop_data["stop_name"]]["ja-Hrkt"], "stop_lat" : float(stop_data["stop_lat"]), "stop_lon" : float(stop_data["stop_lon"]), "platforms" : {} }
        else:
            if len(stop_data["parent_station"]) >= 1:
                stop_id = stop_data["parent_station"]
            else:
                stop_id = stop_data["stop_id"][:stop_data["stop_id"].rfind("_")]
            
            if stop_id not in stop_info["stops"]:
                stop_info["stops"][stop_id] = { "stop_name" : stop_data["stop_name"], "stop_name_kana" : translation_data[stop_data["stop_name"]]["ja-Hrkt"], "stop_lat" : None, "stop_lon" : None, "platforms" : {} }
            
            if len(stop_data["platform_code"]) >= 1:
                platform_code = stop_data["platform_code"]
            else:
                platform_code = chr(ord("A") + len(stop_info["stops"][stop_id]["platforms"]))
            
            stop_info["stops"][stop_id]["platforms"][stop_data["stop_id"]] = { "platform_code" : platform_code }
            
            parent_stations[stop_data["stop_id"]] = stop_id
            
            if stop_info["stops"][stop_id]["stop_lat"] is None:
                stop_info["stops"][stop_id]["platforms"][stop_data["stop_id"]]["stop_lat"] = float(stop_data["stop_lat"])
                stop_info["stops"][stop_id]["platforms"][stop_data["stop_id"]]["stop_lon"] = float(stop_data["stop_lon"])
    
    for stop_id in stop_info["stops"].keys():
        if stop_info["stops"][stop_id]["stop_lat"] is None:
            lat_sum = 0.0
            lon_sum = 0.0
            
            for platform_id in stop_info["stops"][stop_id]["platforms"].keys():
                lat_sum += stop_info["stops"][stop_id]["platforms"][platform_id].pop("stop_lat")
                lon_sum += stop_info["stops"][stop_id]["platforms"][platform_id].pop("stop_lon")
            
            platform_count = len(stop_info["stops"][stop_id]["platforms"])
            
            stop_info["stops"][stop_id]["stop_lat"] = round(lat_sum / platform_count, 5)
            stop_info["stops"][stop_id]["stop_lon"] = round(lon_sum / platform_count, 5)
    
    
    mes("時刻表情報を変換しています...")
    
    timetables = {}
    trip_service_ids = {}
    alighting_platforms = set()
    boarding_platforms = set()
    
    for trip in trips:
        if trip["service_id"] not in timetables:
            timetables[trip["service_id"]] = {}
        
        if len(trip["direction_id"]) >= 1:
            direction_id = int(trip["direction_id"])
        else:
            direction_id = 0
        
        timetables[trip["service_id"]][trip["trip_id"]] = { "route_id" : trip["route_id"], "direction_id" : direction_id, "stop_headsigns" : [], "departure_times" : [], "pickup_types" : [] }
        
        trip_service_ids[trip["trip_id"]] = trip["service_id"]
    
    last_trip_id = None
    last_stop_headsign = None
    stop_index = 0
    
    route_stops = {}
    
    for stop_time in stop_times:
        service_id = trip_service_ids[stop_time["trip_id"]]
        
        if stop_time["trip_id"] != last_trip_id:
            last_trip_id = stop_time["trip_id"]
            last_stop_headsign = None
            stop_index = 0
            
            if timetables[service_id][stop_time["trip_id"]]["route_id"] not in route_stops:
                route_stops[timetables[service_id][stop_time["trip_id"]]["route_id"]] = []
                write_route = True
            else:
                write_route = False
        
        if stop_time["stop_headsign"] != last_stop_headsign:
            timetables[service_id][stop_time["trip_id"]]["stop_headsigns"].append({ "stop_index" : stop_index, "stop_headsign" : stop_time["stop_headsign"] })
            last_stop_headsign = stop_time["stop_headsign"]
        
        pickup_type = int(stop_time["pickup_type"])
        
        timetables[service_id][stop_time["trip_id"]]["departure_times"].append(stop_time["departure_time"][:5])
        timetables[service_id][stop_time["trip_id"]]["pickup_types"].append(pickup_type)
        
        if write_route:
            if not timetables[service_id][stop_time["trip_id"]]["direction_id"]:
                route_stops[timetables[service_id][stop_time["trip_id"]]["route_id"]].append({ "stop_id" : parent_stations[stop_time["stop_id"]], "platform_id" : stop_time["stop_id"] })
            else:
                route_stops[timetables[service_id][stop_time["trip_id"]]["route_id"]].insert(0, { "stop_id" : parent_stations[stop_time["stop_id"]], "platform_id" : stop_time["stop_id"] })
        
        if pickup_type == 1:
            alighting_platforms.add(stop_time["stop_id"])
        else:
            boarding_platforms.add(stop_time["stop_id"])
        
        stop_index += 1
    
    alighting_only_platforms = alighting_platforms - boarding_platforms
    
    for platform_id in alighting_only_platforms:
        stop_info["stops"][parent_stations[platform_id]]["platforms"][platform_id]["alighting_only"] = True
    
    
    mes("系統情報を変換しています...")
    
    for route in routes:
        route_info[route["route_id"]] = { "route_number" : route["route_short_name"], "route_name" : route["route_long_name"], "route_desc" : route["route_desc"], "stops" : route_stops.get(route["route_id"], []) }
        
        if len(route["route_color"]) >= 1:
            route_info[route["route_id"]]["route_color"] = route["route_color"]
            route_info[route["route_id"]]["route_text_color"] = route["route_text_color"]
        else:
            route_info[route["route_id"]]["route_color"] = None
            route_info[route["route_id"]]["route_text_color"] = None
        
        if len(route["route_short_name"]) == 0:
            bracket_pos = route["route_long_name"].rfind("【")
            
            if bracket_pos != -1:
                route_info[route["route_id"]]["route_name"] = route["route_long_name"][:bracket_pos]
                route_info[route["route_id"]]["route_number"] = route["route_long_name"][bracket_pos + 1:-1]
            else:
                route_info[route["route_id"]]["route_number"] = None
    
    
    mes("stop_info.jsonに保存しています...")
    with open(main_dir + "/" + diagram_revision + "/stop_info.json", "w", encoding="utf-8") as json_f:
        json.dump(stop_info, json_f, ensure_ascii=False, indent=4)
    
    
    mes("route_info.jsonに保存しています...")
    with open(main_dir + "/" + diagram_revision + "/route_info.json", "w", encoding="utf-8") as json_f:
        json.dump(route_info, json_f, ensure_ascii=False, separators=(',', ':'))
    
    
    for service_id in timetables.keys():
        timetable_file_name = "timetable_" + service_id + ".json"
        
        mes(timetable_file_name + "に保存しています...")
        
        with open(main_dir + "/" + diagram_revision + "/" + timetable_file_name, "w", encoding="utf-8") as json_f:
            json.dump(timetables[service_id], json_f, ensure_ascii=False, separators=(',', ':'))
    
    
    mes("処理が完了しました")
