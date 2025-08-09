# coding: utf-8

import os
import sqlite3

def init_db (mes, main_dir):
    mes("データベースのセットアップ", is_heading=True)
    
    mes("データベースに接続しています...")
    
    db_file_path = main_dir + "/operation_data.db"
    
    if not os.path.exists(db_file_path):
        new_db = True
    else:
        new_db = False
    
    conn = sqlite3.connect(db_file_path)
    
    cur = conn.cursor()
    
    mes("テーブル「busrun_trips」を作成しています...")
    cur.execute("CREATE TABLE IF NOT EXISTS `busrun_trips`(`diagram_revision` TEXT NOT NULL, `service_id` TEXT NOT NULL, `operation_id` TEXT NOT NULL, `trip_id` TEXT NOT NULL, PRIMARY KEY(`diagram_revision`, `service_id`, `operation_id`, `trip_id`))")
    cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS `busrun_idx_t1` ON `busrun_trips`(`diagram_revision`, `service_id`, `trip_id`)")
    
    mes("テーブル「busrun_operation_logs」を作成しています...")
    cur.execute("CREATE TABLE IF NOT EXISTS `busrun_operation_logs`(`operation_date` TEXT NOT NULL, `trip_id` TEXT NOT NULL, `vehicle_name` TEXT NOT NULL, PRIMARY KEY(`operation_date`, `trip_id`))")
    
    mes("テーブル「busrun_data」を作成しています...")
    cur.execute("CREATE TABLE IF NOT EXISTS `busrun_data`(`operation_date` TEXT NOT NULL, `operation_id` TEXT NOT NULL, `assign_order` INTEGER NOT NULL, `vehicle_name` TEXT NOT NULL, `updated_datetime` TEXT NOT NULL, PRIMARY KEY(`operation_date`, `operation_id`, `assign_order`))")
    cur.execute("CREATE INDEX IF NOT EXISTS `busrun_idx_d1` ON `busrun_data`(`vehicle_name`, `operation_date`, `operation_id`)")
    cur.execute("CREATE INDEX IF NOT EXISTS `busrun_idx_d2` ON `busrun_data`(`operation_date`, `updated_datetime`, `operation_id`, `assign_order`)")
    cur.execute("CREATE INDEX IF NOT EXISTS `busrun_idx_d3` ON `busrun_data`(`operation_id`, `operation_date`, `assign_order`)")
    
    mes("変更を保存しています...")
    conn.commit()
    conn.close()
    
    if new_db and os.name == "posix":
        os.chmod(db_file_path, 0o766)
    
    mes("処理が完了しました")
