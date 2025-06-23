#!/usr/bin/env python3
"""
نظام مراقبة وتحكم مضخات النفط المتقدم
Advanced Oil Pump Monitoring and Control System

تطوير: سند الشارف سوف مريعي
Development: Sanad Al-Sharif Soof Muraiei

نظام احترافي لمراقبة والتحكم في مضخات النفط للشركات النفطية
Professional system for monitoring and controlling oil pumps for oil companies

الميزات الرئيسية:
- مراقبة في الوقت الفعلي
- أزرار تحكم متقدمة (تشغيل/إيقاف/طوارئ/تلقائي)
- نظام إنذارات ذكي
- مزامنة بين المستخدمين
- واجهة احترافية للمهندسين
"""

import os
import sys
import json
import time
import random
import logging
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

# Flask and extensions
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('oil_pump_system.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class OilPumpSystem:
    """
    نظام مراقبة وتحكم مضخات النفط
    Oil Pump Monitoring and Control System
    """
    
    def __init__(self):
        """تهيئة النظام"""
        self.app = Flask(__name__, 
                        static_folder='static',
                        template_folder='templates')
        
        # إعداد التطبيق
        self.app.config['SECRET_KEY'] = 'oil-pump-system-2025-sanad-alsharif'
        self.app.config['DEBUG'] = False
        
        # إعداد CORS
        CORS(self.app, origins="*")
        
        # إعداد SocketIO
        self.socketio = SocketIO(self.app, 
                               cors_allowed_origins="*",
                               async_mode='threading',
                               logger=False,
                               engineio_logger=False)
        
        # بيانات النظام
        self.pumps_data = {}
        self.users_online = {}
        self.system_alerts = []
        self.activity_log = []
        self.chat_messages = []
        self.system_health = {
            'score': 95,
            'status': 'excellent',
            'last_update': datetime.now().isoformat()
        }
        
        # إعداد المضخات الافتراضية
        self.initialize_pumps()
        
        # إعداد المسارات
        self.setup_routes()
        
        # إعداد أحداث SocketIO
        self.setup_socketio_events()
        
        # بدء المراقبة الخلفية
        self.start_background_monitoring()
        
        logger.info("تم تهيئة نظام مراقبة مضخات النفط بنجاح")
    
    def initialize_pumps(self):
        """تهيئة بيانات المضخات الافتراضية"""
        pump_types = [
            'مضخة طرد مركزي',
            'مضخة ترددية',
            'مضخة دوارة',
            'مضخة غاطسة',
            'مضخة محورية',
            'مضخة تروس'
        ]
        
        locations = [
            'المنطقة الشمالية',
            'المنطقة الجنوبية',
            'المنطقة الشرقية',
            'المنطقة الغربية',
            'المنطقة الوسطى',
            'المنطقة الساحلية'
        ]
        
        for i in range(1, 7):
            self.pumps_data[i] = {
                'id': i,
                'name': f'مضخة النفط {i}',
                'type': pump_types[i-1],
                'location': locations[i-1],
                'status': 'running' if i <= 4 else 'stopped',
                'auto_mode': True,
                'emergency_stop': False,
                'metrics': {
                    'pressure': round(random.uniform(45, 85), 1),
                    'temperature': round(random.uniform(65, 95), 1),
                    'flow_rate': round(random.uniform(150, 300), 1),
                    'vibration': round(random.uniform(0.5, 2.5), 2),
                    'power': round(random.uniform(75, 95), 1),
                    'efficiency': round(random.uniform(85, 98), 1)
                },
                'thresholds': {
                    'pressure_min': 50,
                    'pressure_max': 80,
                    'temperature_max': 90,
                    'flow_rate_min': 180,
                    'vibration_max': 2.0,
                    'efficiency_min': 85
                },
                'alerts': [],
                'last_maintenance': (datetime.now() - timedelta(days=random.randint(10, 90))).isoformat(),
                'next_maintenance': (datetime.now() + timedelta(days=random.randint(30, 120))).isoformat(),
                'total_runtime': random.randint(5000, 15000),
                'production_today': round(random.uniform(1000, 5000), 1),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
        
        logger.info(f"تم تهيئة {len(self.pumps_data)} مضخة بنجاح")
    
    def setup_routes(self):
        """إعداد مسارات التطبيق"""
        
        @self.app.route('/')
        def index():
            """الصفحة الرئيسية"""
            return render_template('index.html')
        
        @self.app.route('/api/pumps')
        def get_pumps():
            """الحصول على بيانات جميع المضخات"""
            try:
                return jsonify({
                    'success': True,
                    'pumps': list(self.pumps_data.values()),
                    'total': len(self.pumps_data),
                    'timestamp': datetime.now().isoformat()
                })
            except Exception as e:
                logger.error(f"خطأ في جلب بيانات المضخات: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': 'فشل في جلب بيانات المضخات'
                }), 500
        
        @self.app.route('/api/pumps/<int:pump_id>')
        def get_pump(pump_id):
            """الحصول على بيانات مضخة معينة"""
            try:
                if pump_id not in self.pumps_data:
                    return jsonify({
                        'success': False,
                        'error': 'المضخة غير موجودة'
                    }), 404
                
                return jsonify({
                    'success': True,
                    'pump': self.pumps_data[pump_id],
                    'timestamp': datetime.now().isoformat()
                })
            except Exception as e:
                logger.error(f"خطأ في جلب بيانات المضخة {pump_id}: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': 'فشل في جلب بيانات المضخة'
                }), 500
        
        @self.app.route('/api/pumps/<int:pump_id>/control', methods=['POST'])
        def control_pump(pump_id):
            """التحكم في مضخة معينة"""
            try:
                if pump_id not in self.pumps_data:
                    return jsonify({
                        'success': False,
                        'error': 'المضخة غير موجودة'
                    }), 404
                
                data = request.get_json()
                action = data.get('action')
                user_id = data.get('user_id', 'غير محدد')
                
                pump = self.pumps_data[pump_id]
                old_status = pump['status']
                
                # تنفيذ الإجراء
                if action == 'start':
                    if pump['emergency_stop']:
                        return jsonify({
                            'success': False,
                            'error': 'لا يمكن تشغيل المضخة في حالة إيقاف الطوارئ'
                        }), 400
                    pump['status'] = 'running'
                    message = f"تم تشغيل {pump['name']}"
                    
                elif action == 'stop':
                    pump['status'] = 'stopped'
                    message = f"تم إيقاف {pump['name']}"
                    
                elif action == 'emergency_stop':
                    pump['status'] = 'emergency_stop'
                    pump['emergency_stop'] = True
                    message = f"تم إيقاف الطوارئ لـ {pump['name']}"
                    
                elif action == 'standby':
                    pump['status'] = 'standby'
                    message = f"تم وضع {pump['name']} في وضع الاستعداد"
                    
                elif action == 'auto':
                    pump['auto_mode'] = not pump['auto_mode']
                    mode = "التلقائي" if pump['auto_mode'] else "اليدوي"
                    message = f"تم تغيير {pump['name']} إلى الوضع {mode}"
                    
                elif action == 'reset_emergency':
                    pump['emergency_stop'] = False
                    pump['status'] = 'stopped'
                    message = f"تم إعادة تعيين إيقاف الطوارئ لـ {pump['name']}"
                    
                elif action == 'maintenance':
                    pump['status'] = 'maintenance'
                    message = f"تم وضع {pump['name']} في وضع الصيانة"
                    
                else:
                    return jsonify({
                        'success': False,
                        'error': 'إجراء غير صحيح'
                    }), 400
                
                # تحديث الوقت
                pump['updated_at'] = datetime.now().isoformat()
                
                # إضافة إلى سجل النشاط
                self.add_activity_log(
                    message=message,
                    user=user_id,
                    type='operation',
                    pump_id=pump_id
                )
                
                # إرسال التحديث لجميع المستخدمين
                self.socketio.emit('pump_updated', {
                    'pump_id': pump_id,
                    'pump': pump,
                    'message': message,
                    'user': user_id
                }, broadcast=True)
                
                logger.info(f"تم تنفيذ الإجراء {action} على المضخة {pump_id} بواسطة {user_id}")
                
                return jsonify({
                    'success': True,
                    'message': message,
                    'pump': pump,
                    'timestamp': datetime.now().isoformat()
                })
                
            except Exception as e:
                logger.error(f"خطأ في التحكم بالمضخة {pump_id}: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': 'فشل في التحكم بالمضخة'
                }), 500
        
        @self.app.route('/api/system/stats')
        def get_system_stats():
            """الحصول على إحصائيات النظام"""
            try:
                running_pumps = len([p for p in self.pumps_data.values() if p['status'] == 'running'])
                stopped_pumps = len([p for p in self.pumps_data.values() if p['status'] == 'stopped'])
                maintenance_pumps = len([p for p in self.pumps_data.values() if p['status'] == 'maintenance'])
                
                total_production = sum(p['production_today'] for p in self.pumps_data.values())
                avg_efficiency = sum(p['metrics']['efficiency'] for p in self.pumps_data.values()) / len(self.pumps_data)
                
                active_alerts = len([alert for pump in self.pumps_data.values() for alert in pump['alerts']])
                
                return jsonify({
                    'success': True,
                    'stats': {
                        'total_pumps': len(self.pumps_data),
                        'running_pumps': running_pumps,
                        'stopped_pumps': stopped_pumps,
                        'maintenance_pumps': maintenance_pumps,
                        'total_production': round(total_production, 1),
                        'avg_efficiency': round(avg_efficiency, 1),
                        'active_alerts': active_alerts,
                        'users_online': len(self.users_online),
                        'system_health': self.system_health
                    },
                    'timestamp': datetime.now().isoformat()
                })
            except Exception as e:
                logger.error(f"خطأ في جلب إحصائيات النظام: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': 'فشل في جلب إحصائيات النظام'
                }), 500
        
        @self.app.route('/api/system/alerts')
        def get_system_alerts():
            """الحصول على تنبيهات النظام"""
            try:
                all_alerts = []
                for pump in self.pumps_data.values():
                    for alert in pump['alerts']:
                        alert['pump_name'] = pump['name']
                        all_alerts.append(alert)
                
                # ترتيب حسب الأولوية والوقت
                all_alerts.sort(key=lambda x: (
                    0 if x['severity'] == 'critical' else 1 if x['severity'] == 'warning' else 2,
                    x['timestamp']
                ), reverse=True)
                
                return jsonify({
                    'success': True,
                    'alerts': all_alerts,
                    'total': len(all_alerts),
                    'timestamp': datetime.now().isoformat()
                })
            except Exception as e:
                logger.error(f"خطأ في جلب تنبيهات النظام: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': 'فشل في جلب تنبيهات النظام'
                }), 500
        
        @self.app.route('/api/activity')
        def get_activity_log():
            """الحصول على سجل النشاط"""
            try:
                limit = request.args.get('limit', 50, type=int)
                recent_activities = self.activity_log[-limit:] if limit > 0 else self.activity_log
                recent_activities.reverse()
                
                return jsonify({
                    'success': True,
                    'activities': recent_activities,
                    'total': len(self.activity_log),
                    'timestamp': datetime.now().isoformat()
                })
            except Exception as e:
                logger.error(f"خطأ في جلب سجل النشاط: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': 'فشل في جلب سجل النشاط'
                }), 500
        
        @self.app.route('/api/chat/messages')
        def get_chat_messages():
            """الحصول على رسائل الدردشة"""
            try:
                limit = request.args.get('limit', 50, type=int)
                recent_messages = self.chat_messages[-limit:] if limit > 0 else self.chat_messages
                
                return jsonify({
                    'success': True,
                    'messages': recent_messages,
                    'total': len(self.chat_messages),
                    'timestamp': datetime.now().isoformat()
                })
            except Exception as e:
                logger.error(f"خطأ في جلب رسائل الدردشة: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': 'فشل في جلب رسائل الدردشة'
                }), 500
        
        @self.app.route('/api/emergency/all', methods=['POST'])
        def emergency_stop_all():
            """إيقاف طوارئ لجميع المضخات"""
            try:
                data = request.get_json()
                user_id = data.get('user_id', 'غير محدد')
                
                stopped_pumps = []
                for pump_id, pump in self.pumps_data.items():
                    if pump['status'] == 'running':
                        pump['status'] = 'emergency_stop'
                        pump['emergency_stop'] = True
                        pump['updated_at'] = datetime.now().isoformat()
                        stopped_pumps.append(pump['name'])
                
                message = f"تم إيقاف الطوارئ لجميع المضخات ({len(stopped_pumps)} مضخة)"
                
                # إضافة إلى سجل النشاط
                self.add_activity_log(
                    message=message,
                    user=user_id,
                    type='emergency'
                )
                
                # إرسال التحديث لجميع المستخدمين
                self.socketio.emit('emergency_stop_all', {
                    'message': message,
                    'user': user_id,
                    'stopped_pumps': stopped_pumps,
                    'pumps': list(self.pumps_data.values())
                }, broadcast=True)
                
                logger.warning(f"تم تنفيذ إيقاف الطوارئ لجميع المضخات بواسطة {user_id}")
                
                return jsonify({
                    'success': True,
                    'message': message,
                    'stopped_pumps': stopped_pumps,
                    'timestamp': datetime.now().isoformat()
                })
                
            except Exception as e:
                logger.error(f"خطأ في إيقاف الطوارئ لجميع المضخات: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': 'فشل في إيقاف الطوارئ لجميع المضخات'
                }), 500
        
        @self.app.route('/api/auto/all', methods=['POST'])
        def auto_mode_all():
            """تفعيل الوضع التلقائي لجميع المضخات"""
            try:
                data = request.get_json()
                user_id = data.get('user_id', 'غير محدد')
                
                auto_pumps = []
                for pump_id, pump in self.pumps_data.items():
                    if not pump['emergency_stop']:
                        pump['auto_mode'] = True
                        pump['updated_at'] = datetime.now().isoformat()
                        auto_pumps.append(pump['name'])
                
                message = f"تم تفعيل الوضع التلقائي لجميع المضخات ({len(auto_pumps)} مضخة)"
                
                # إضافة إلى سجل النشاط
                self.add_activity_log(
                    message=message,
                    user=user_id,
                    type='configuration'
                )
                
                # إرسال التحديث لجميع المستخدمين
                self.socketio.emit('auto_mode_all', {
                    'message': message,
                    'user': user_id,
                    'auto_pumps': auto_pumps,
                    'pumps': list(self.pumps_data.values())
                }, broadcast=True)
                
                logger.info(f"تم تفعيل الوضع التلقائي لجميع المضخات بواسطة {user_id}")
                
                return jsonify({
                    'success': True,
                    'message': message,
                    'auto_pumps': auto_pumps,
                    'timestamp': datetime.now().isoformat()
                })
                
            except Exception as e:
                logger.error(f"خطأ في تفعيل الوضع التلقائي لجميع المضخات: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': 'فشل في تفعيل الوضع التلقائي لجميع المضخات'
                }), 500
    
    def setup_socketio_events(self):
        """إعداد أحداث SocketIO"""
        
        @self.socketio.on('connect')
        def handle_connect():
            """معالج الاتصال"""
            try:
                logger.info(f"مستخدم جديد متصل: {request.sid}")
                emit('connected', {
                    'message': 'تم الاتصال بنجاح',
                    'timestamp': datetime.now().isoformat()
                })
            except Exception as e:
                logger.error(f"خطأ في معالج الاتصال: {str(e)}")
        
        @self.socketio.on('disconnect')
        def handle_disconnect():
            """معالج قطع الاتصال"""
            try:
                if request.sid in self.users_online:
                    user = self.users_online[request.sid]
                    del self.users_online[request.sid]
                    logger.info(f"تم قطع اتصال المستخدم: {user.get('name', 'غير محدد')}")
                    
                    # إشعار المستخدمين الآخرين
                    emit('user_disconnected', {
                        'user': user,
                        'users_online': len(self.users_online)
                    }, broadcast=True)
            except Exception as e:
                logger.error(f"خطأ في معالج قطع الاتصال: {str(e)}")
        
        @self.socketio.on('user_login')
        def handle_user_login(data):
            """معالج تسجيل دخول المستخدم"""
            try:
                employee_id = data.get('employee_id')
                password = data.get('password')
                
                # التحقق من بيانات الاعتماد
                user = self.authenticate_user(employee_id, password)
                if user:
                    # إضافة المستخدم إلى القائمة المتصلة
                    self.users_online[request.sid] = user
                    
                    # إضافة إلى سجل النشاط
                    self.add_activity_log(
                        message=f"تسجيل دخول المستخدم {user['name']}",
                        user=user['name'],
                        type='info'
                    )
                    
                    emit('login_success', {
                        'user': user,
                        'message': 'تم تسجيل الدخول بنجاح'
                    })
                    
                    # إشعار المستخدمين الآخرين
                    emit('user_connected', {
                        'user': user,
                        'users_online': len(self.users_online)
                    }, broadcast=True, include_self=False)
                    
                    logger.info(f"تم تسجيل دخول المستخدم: {user['name']}")
                else:
                    emit('login_failed', {
                        'error': 'بيانات الاعتماد غير صحيحة'
                    })
                    logger.warning(f"محاولة تسجيل دخول فاشلة: {employee_id}")
                    
            except Exception as e:
                logger.error(f"خطأ في معالج تسجيل الدخول: {str(e)}")
                emit('login_failed', {
                    'error': 'خطأ في الخادم'
                })
        
        @self.socketio.on('send_message')
        def handle_send_message(data):
            """معالج إرسال رسالة"""
            try:
                if request.sid not in self.users_online:
                    emit('error', {'message': 'يجب تسجيل الدخول أولاً'})
                    return
                
                user = self.users_online[request.sid]
                message_text = data.get('message', '').strip()
                
                if not message_text:
                    emit('error', {'message': 'الرسالة فارغة'})
                    return
                
                # إنشاء رسالة جديدة
                message = {
                    'id': len(self.chat_messages) + 1,
                    'user': user['name'],
                    'user_role': user['role'],
                    'message': message_text,
                    'timestamp': datetime.now().isoformat(),
                    'type': 'user'
                }
                
                # إضافة الرسالة إلى القائمة
                self.chat_messages.append(message)
                
                # الاحتفاظ بآخر 100 رسالة فقط
                if len(self.chat_messages) > 100:
                    self.chat_messages = self.chat_messages[-100:]
                
                # إرسال الرسالة لجميع المستخدمين
                emit('new_message', message, broadcast=True)
                
                logger.info(f"رسالة جديدة من {user['name']}: {message_text[:50]}...")
                
            except Exception as e:
                logger.error(f"خطأ في معالج إرسال الرسالة: {str(e)}")
                emit('error', {'message': 'فشل في إرسال الرسالة'})
        
        @self.socketio.on('request_data_update')
        def handle_request_data_update():
            """معالج طلب تحديث البيانات"""
            try:
                emit('data_update', {
                    'pumps': list(self.pumps_data.values()),
                    'system_health': self.system_health,
                    'users_online': len(self.users_online),
                    'timestamp': datetime.now().isoformat()
                })
            except Exception as e:
                logger.error(f"خطأ في معالج طلب تحديث البيانات: {str(e)}")
    
    def authenticate_user(self, employee_id: str, password: str) -> Optional[Dict]:
        """مصادقة المستخدم"""
        # بيانات المستخدمين الافتراضية
        users = {
            '38859': {
                'employee_id': '38859',
                'name': 'سند الشارف سوف مريعي',
                'role': 'admin',
                'password': '12345',
                'department': 'إدارة النظم',
                'position': 'مدير النظام'
            },
            'admin': {
                'employee_id': 'admin',
                'name': 'مشغل النظام',
                'role': 'operator',
                'password': 'admin',
                'department': 'العمليات',
                'position': 'مشغل مضخات'
            }
        }
        
        user = users.get(employee_id)
        if user and user['password'] == password:
            # إرجاع بيانات المستخدم بدون كلمة المرور
            user_data = user.copy()
            del user_data['password']
            user_data['login_time'] = datetime.now().isoformat()
            return user_data
        
        return None
    
    def add_activity_log(self, message: str, user: str, type: str = 'info', pump_id: Optional[int] = None):
        """إضافة نشاط إلى السجل"""
        activity = {
            'id': len(self.activity_log) + 1,
            'message': message,
            'user': user,
            'type': type,  # info, success, warning, error, operation, emergency, configuration
            'pump_id': pump_id,
            'timestamp': datetime.now().isoformat()
        }
        
        self.activity_log.append(activity)
        
        # الاحتفاظ بآخر 500 نشاط فقط
        if len(self.activity_log) > 500:
            self.activity_log = self.activity_log[-500:]
        
        # إرسال النشاط لجميع المستخدمين المتصلين
        self.socketio.emit('new_activity', activity, broadcast=True)
    
    def update_pump_metrics(self, pump_id: int):
        """تحديث مقاييس المضخة"""
        if pump_id not in self.pumps_data:
            return
        
        pump = self.pumps_data[pump_id]
        
        # تحديث المقاييس حسب حالة المضخة
        if pump['status'] == 'running':
            # تحديث طبيعي مع تغييرات طفيفة
            pump['metrics']['pressure'] += random.uniform(-2, 2)
            pump['metrics']['temperature'] += random.uniform(-1, 3)
            pump['metrics']['flow_rate'] += random.uniform(-10, 10)
            pump['metrics']['vibration'] += random.uniform(-0.1, 0.2)
            pump['metrics']['power'] += random.uniform(-2, 2)
            pump['metrics']['efficiency'] += random.uniform(-1, 1)
            
            # زيادة الإنتاج
            pump['production_today'] += random.uniform(1, 5)
            
        elif pump['status'] in ['stopped', 'emergency_stop']:
            # قيم منخفضة للمضخات المتوقفة
            pump['metrics']['pressure'] = max(0, pump['metrics']['pressure'] - random.uniform(5, 10))
            pump['metrics']['temperature'] = max(20, pump['metrics']['temperature'] - random.uniform(2, 5))
            pump['metrics']['flow_rate'] = 0
            pump['metrics']['vibration'] = 0
            pump['metrics']['power'] = 0
            pump['metrics']['efficiency'] = 0
            
        elif pump['status'] == 'maintenance':
            # قيم ثابتة للصيانة
            pump['metrics']['pressure'] = 0
            pump['metrics']['temperature'] = random.uniform(20, 30)
            pump['metrics']['flow_rate'] = 0
            pump['metrics']['vibration'] = 0
            pump['metrics']['power'] = 0
            pump['metrics']['efficiency'] = 0
        
        # تطبيق الحدود
        pump['metrics']['pressure'] = max(0, min(100, pump['metrics']['pressure']))
        pump['metrics']['temperature'] = max(20, min(120, pump['metrics']['temperature']))
        pump['metrics']['flow_rate'] = max(0, min(500, pump['metrics']['flow_rate']))
        pump['metrics']['vibration'] = max(0, min(5, pump['metrics']['vibration']))
        pump['metrics']['power'] = max(0, min(100, pump['metrics']['power']))
        pump['metrics']['efficiency'] = max(0, min(100, pump['metrics']['efficiency']))
        
        # تقريب القيم
        for key in pump['metrics']:
            if key in ['pressure', 'temperature', 'flow_rate', 'power', 'efficiency']:
                pump['metrics'][key] = round(pump['metrics'][key], 1)
            elif key == 'vibration':
                pump['metrics'][key] = round(pump['metrics'][key], 2)
        
        # فحص التنبيهات
        self.check_pump_alerts(pump_id)
        
        # تحديث الوقت
        pump['updated_at'] = datetime.now().isoformat()
    
    def check_pump_alerts(self, pump_id: int):
        """فحص تنبيهات المضخة"""
        if pump_id not in self.pumps_data:
            return
        
        pump = self.pumps_data[pump_id]
        metrics = pump['metrics']
        thresholds = pump['thresholds']
        
        # مسح التنبيهات القديمة
        pump['alerts'] = []
        
        # فحص الضغط
        if metrics['pressure'] < thresholds['pressure_min']:
            pump['alerts'].append({
                'id': f"pressure_low_{pump_id}",
                'type': 'pressure_low',
                'severity': 'warning',
                'message': f"انخفاض الضغط في {pump['name']}",
                'description': f"الضغط الحالي {metrics['pressure']} بار أقل من الحد الأدنى {thresholds['pressure_min']} بار",
                'cause': 'نقص في السائل أو انسداد في الأنابيب',
                'image': '/static/images/pressure_low.png',
                'recommendations': [
                    'فحص مستوى السائل في الخزان',
                    'التأكد من عدم وجود انسداد في الأنابيب',
                    'فحص صمامات النظام'
                ],
                'timestamp': datetime.now().isoformat()
            })
        elif metrics['pressure'] > thresholds['pressure_max']:
            pump['alerts'].append({
                'id': f"pressure_high_{pump_id}",
                'type': 'pressure_high',
                'severity': 'critical',
                'message': f"ارتفاع الضغط في {pump['name']}",
                'description': f"الضغط الحالي {metrics['pressure']} بار أعلى من الحد الأقصى {thresholds['pressure_max']} بار",
                'cause': 'انسداد في خط التصريف أو عطل في صمام الأمان',
                'image': '/static/images/pressure_high.png',
                'recommendations': [
                    'إيقاف المضخة فوراً',
                    'فحص صمام الأمان',
                    'التأكد من عدم انسداد خط التصريف'
                ],
                'timestamp': datetime.now().isoformat()
            })
        
        # فحص درجة الحرارة
        if metrics['temperature'] > thresholds['temperature_max']:
            pump['alerts'].append({
                'id': f"temperature_high_{pump_id}",
                'type': 'temperature_high',
                'severity': 'critical',
                'message': f"ارتفاع درجة الحرارة في {pump['name']}",
                'description': f"درجة الحرارة الحالية {metrics['temperature']}°م أعلى من الحد الأقصى {thresholds['temperature_max']}°م",
                'cause': 'نقص في سائل التبريد أو عطل في المروحة',
                'image': '/static/images/temperature_high.png',
                'recommendations': [
                    'فحص نظام التبريد',
                    'التأكد من عمل المروحة',
                    'فحص مستوى سائل التبريد'
                ],
                'timestamp': datetime.now().isoformat()
            })
        
        # فحص معدل التدفق
        if pump['status'] == 'running' and metrics['flow_rate'] < thresholds['flow_rate_min']:
            pump['alerts'].append({
                'id': f"flow_low_{pump_id}",
                'type': 'flow_low',
                'severity': 'warning',
                'message': f"انخفاض معدل التدفق في {pump['name']}",
                'description': f"معدل التدفق الحالي {metrics['flow_rate']} ل/د أقل من الحد الأدنى {thresholds['flow_rate_min']} ل/د",
                'cause': 'انسداد في المرشحات أو تآكل في الأجزاء الداخلية',
                'image': '/static/images/flow_low.png',
                'recommendations': [
                    'تنظيف أو استبدال المرشحات',
                    'فحص الأجزاء الداخلية للمضخة',
                    'التأكد من عدم وجود تسريبات'
                ],
                'timestamp': datetime.now().isoformat()
            })
        
        # فحص الاهتزاز
        if metrics['vibration'] > thresholds['vibration_max']:
            pump['alerts'].append({
                'id': f"vibration_high_{pump_id}",
                'type': 'vibration_high',
                'severity': 'warning',
                'message': f"ارتفاع الاهتزاز في {pump['name']}",
                'description': f"مستوى الاهتزاز الحالي {metrics['vibration']} مم/ث أعلى من الحد الأقصى {thresholds['vibration_max']} مم/ث",
                'cause': 'عدم توازن في الدوار أو تآكل في المحامل',
                'image': '/static/images/vibration_high.png',
                'recommendations': [
                    'فحص توازن الدوار',
                    'فحص حالة المحامل',
                    'التأكد من ثبات قاعدة المضخة'
                ],
                'timestamp': datetime.now().isoformat()
            })
        
        # فحص الكفاءة
        if pump['status'] == 'running' and metrics['efficiency'] < thresholds['efficiency_min']:
            pump['alerts'].append({
                'id': f"efficiency_low_{pump_id}",
                'type': 'efficiency_low',
                'severity': 'info',
                'message': f"انخفاض الكفاءة في {pump['name']}",
                'description': f"الكفاءة الحالية {metrics['efficiency']}% أقل من الحد الأدنى {thresholds['efficiency_min']}%",
                'cause': 'تآكل في الأجزاء الداخلية أو الحاجة للصيانة',
                'image': '/static/images/efficiency_low.png',
                'recommendations': [
                    'جدولة صيانة دورية',
                    'فحص الأجزاء الداخلية',
                    'تحسين ظروف التشغيل'
                ],
                'timestamp': datetime.now().isoformat()
            })
        
        # إرسال التنبيهات الجديدة
        if pump['alerts']:
            for alert in pump['alerts']:
                self.socketio.emit('new_alert', {
                    'pump_id': pump_id,
                    'pump_name': pump['name'],
                    'alert': alert
                }, broadcast=True)
    
    def update_system_health(self):
        """تحديث صحة النظام"""
        try:
            # حساب نقاط الصحة
            total_score = 0
            factors = 0
            
            # عدد المضخات العاملة
            running_pumps = len([p for p in self.pumps_data.values() if p['status'] == 'running'])
            total_pumps = len(self.pumps_data)
            if total_pumps > 0:
                pump_score = (running_pumps / total_pumps) * 30
                total_score += pump_score
                factors += 30
            
            # متوسط الكفاءة
            running_efficiencies = [p['metrics']['efficiency'] for p in self.pumps_data.values() if p['status'] == 'running']
            if running_efficiencies:
                avg_efficiency = sum(running_efficiencies) / len(running_efficiencies)
                efficiency_score = (avg_efficiency / 100) * 25
                total_score += efficiency_score
                factors += 25
            
            # عدد التنبيهات النشطة
            active_alerts = len([alert for pump in self.pumps_data.values() for alert in pump['alerts']])
            critical_alerts = len([alert for pump in self.pumps_data.values() for alert in pump['alerts'] if alert['severity'] == 'critical'])
            
            alert_penalty = min(active_alerts * 2 + critical_alerts * 5, 20)
            alert_score = max(0, 20 - alert_penalty)
            total_score += alert_score
            factors += 20
            
            # استقرار النظام (عدد المضخات في حالة طوارئ)
            emergency_pumps = len([p for p in self.pumps_data.values() if p['status'] == 'emergency_stop'])
            emergency_penalty = emergency_pumps * 10
            stability_score = max(0, 25 - emergency_penalty)
            total_score += stability_score
            factors += 25
            
            # حساب النتيجة النهائية
            if factors > 0:
                final_score = min(100, max(0, (total_score / factors) * 100))
            else:
                final_score = 50
            
            # تحديد الحالة
            if final_score >= 90:
                status = 'excellent'
                status_ar = 'ممتاز'
            elif final_score >= 80:
                status = 'good'
                status_ar = 'جيد'
            elif final_score >= 70:
                status = 'acceptable'
                status_ar = 'مقبول'
            elif final_score >= 50:
                status = 'poor'
                status_ar = 'ضعيف'
            else:
                status = 'critical'
                status_ar = 'حرج'
            
            self.system_health = {
                'score': round(final_score, 1),
                'status': status,
                'status_ar': status_ar,
                'factors': {
                    'pump_availability': round((running_pumps / total_pumps) * 100, 1) if total_pumps > 0 else 0,
                    'avg_efficiency': round(sum(running_efficiencies) / len(running_efficiencies), 1) if running_efficiencies else 0,
                    'active_alerts': active_alerts,
                    'critical_alerts': critical_alerts,
                    'emergency_pumps': emergency_pumps
                },
                'last_update': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"خطأ في تحديث صحة النظام: {str(e)}")
    
    def background_monitoring(self):
        """مراقبة خلفية للنظام"""
        while True:
            try:
                # تحديث مقاييس جميع المضخات
                for pump_id in self.pumps_data.keys():
                    self.update_pump_metrics(pump_id)
                
                # تحديث صحة النظام
                self.update_system_health()
                
                # إرسال تحديث البيانات لجميع المستخدمين
                self.socketio.emit('data_update', {
                    'pumps': list(self.pumps_data.values()),
                    'system_health': self.system_health,
                    'users_online': len(self.users_online),
                    'timestamp': datetime.now().isoformat()
                }, broadcast=True)
                
                # انتظار 5 ثوان قبل التحديث التالي
                time.sleep(5)
                
            except Exception as e:
                logger.error(f"خطأ في المراقبة الخلفية: {str(e)}")
                time.sleep(10)  # انتظار أطول في حالة الخطأ
    
    def start_background_monitoring(self):
        """بدء المراقبة الخلفية"""
        monitoring_thread = threading.Thread(target=self.background_monitoring, daemon=True)
        monitoring_thread.start()
        logger.info("تم بدء المراقبة الخلفية للنظام")
    
    def run(self, host='0.0.0.0', port=5000, debug=False):
        """تشغيل النظام"""
        logger.info(f"بدء تشغيل نظام مراقبة مضخات النفط على {host}:{port}")
        self.socketio.run(self.app, host=host, port=port, debug=debug, allow_unsafe_werkzeug=True)

# إنشاء مجلدات الملفات الثابتة والقوالب
def create_directories():
    """إنشاء المجلدات المطلوبة"""
    directories = ['static', 'templates', 'static/images', 'static/css', 'static/js']
    for directory in directories:
        os.makedirs(directory, exist_ok=True)

if __name__ == '__main__':
    try:
        # إنشاء المجلدات المطلوبة
        create_directories()
        
        # إنشاء وتشغيل النظام
        system = OilPumpSystem()
        system.run(host='0.0.0.0', port=5000, debug=False)
        
    except KeyboardInterrupt:
        logger.info("تم إيقاف النظام بواسطة المستخدم")
    except Exception as e:
        logger.error(f"خطأ في تشغيل النظام: {str(e)}")
        sys.exit(1)

