/**
 * نظام مراقبة وتحكم مضخات النفط المتقدم
 * Advanced Oil Pump Monitoring and Control System
 * 
 * تطوير: سند الشارف سوف مريعي
 * Development: Sanad Al-Sharif Soof Muraiei
 * 
 * نظام احترافي لمراقبة والتحكم في مضخات النفط للشركات النفطية
 * Professional system for monitoring and controlling oil pumps for oil companies
 * 
 * الميزات الرئيسية:
 * - مراقبة في الوقت الفعلي مع WebSocket
 * - أزرار تحكم متقدمة (تشغيل/إيقاف/طوارئ/تلقائي)
 * - نظام إنذارات ذكي مع تشخيص الأعطال
 * - مزامنة بين المستخدمين
 * - واجهة احترافية للمهندسين
 * - نظام دردشة مباشر
 * - سجل نشاط شامل
 * - مراقبة صحة النظام
 */

class OilPumpMonitoringSystem {
    constructor() {
        // إعداد النظام
        this.socket = null;
        this.currentUser = null;
        this.pumpsData = {};
        this.systemHealth = {};
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // عناصر DOM
        this.elements = {};
        
        // إعداد الأحداث والاتصال
        this.initializeSystem();
    }
    
    /**
     * تهيئة النظام
     */
    initializeSystem() {
        console.log('🚀 بدء تهيئة نظام مراقبة مضخات النفط...');
        
        // انتظار تحميل DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }
    }
    
    /**
     * معالج جاهزية DOM
     */
    onDOMReady() {
        console.log('📄 تم تحميل DOM بنجاح');
        
        // الحصول على عناصر DOM
        this.cacheElements();
        
        // إعداد الأحداث
        this.setupEventListeners();
        
        // إعداد اتصال WebSocket
        this.initializeSocket();
        
        // إخفاء شاشة التحميل
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 1500);
        
        console.log('✅ تم تهيئة النظام بنجاح');
    }
    
    /**
     * تخزين مراجع عناصر DOM
     */
    cacheElements() {
        this.elements = {
            // شاشات
            loadingScreen: document.getElementById('loading-screen'),
            loginScreen: document.getElementById('login-screen'),
            mainApp: document.getElementById('main-app'),
            
            // نموذج تسجيل الدخول
            loginForm: document.getElementById('login-form'),
            employeeIdInput: document.getElementById('employee-id'),
            passwordInput: document.getElementById('password'),
            loginError: document.getElementById('login-error'),
            
            // الرأس
            userNameSpan: document.getElementById('user-name'),
            userRoleSpan: document.getElementById('user-role'),
            systemStatusSpan: document.getElementById('system-status'),
            healthScoreSpan: document.getElementById('health-score'),
            usersOnlineSpan: document.getElementById('users-online'),
            refreshBtn: document.getElementById('refresh-btn'),
            logoutBtn: document.getElementById('logout-btn'),
            
            // لوحة التحكم
            emergencyStopAllBtn: document.getElementById('emergency-stop-all'),
            autoModeAllBtn: document.getElementById('auto-mode-all'),
            systemDiagnosticsBtn: document.getElementById('system-diagnostics'),
            
            // المحتوى الرئيسي
            pumpsGrid: document.getElementById('pumps-grid'),
            
            // الشريط الجانبي
            sidebarHealthScore: document.getElementById('sidebar-health-score'),
            runningPumpsSpan: document.getElementById('running-pumps'),
            avgEfficiencySpan: document.getElementById('avg-efficiency'),
            activeAlertsSpan: document.getElementById('active-alerts'),
            alertsList: document.getElementById('alerts-list'),
            activityLog: document.getElementById('activity-log'),
            chatMessages: document.getElementById('chat-messages'),
            chatInput: document.getElementById('chat-input'),
            sendMessageBtn: document.getElementById('send-message'),
            
            // النوافذ المنبثقة
            alertModal: document.getElementById('alert-modal'),
            alertModalTitle: document.getElementById('alert-modal-title'),
            alertModalContent: document.getElementById('alert-modal-content'),
            pumpModal: document.getElementById('pump-modal'),
            pumpModalTitle: document.getElementById('pump-modal-title'),
            pumpModalContent: document.getElementById('pump-modal-content'),
            confirmModal: document.getElementById('confirm-modal'),
            confirmModalTitle: document.getElementById('confirm-modal-title'),
            confirmModalMessage: document.getElementById('confirm-modal-message'),
            confirmYesBtn: document.getElementById('confirm-yes'),
            confirmNoBtn: document.getElementById('confirm-no'),
            
            // الإشعارات
            toastContainer: document.getElementById('toast-container'),
            
            // التذييل
            lastUpdateSpan: document.getElementById('last-update')
        };
    }
    
    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // نموذج تسجيل الدخول
        this.elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        
        // أزرار الرأس
        this.elements.refreshBtn.addEventListener('click', () => this.refreshData());
        this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());
        
        // أزرار لوحة التحكم
        this.elements.emergencyStopAllBtn.addEventListener('click', () => this.handleEmergencyStopAll());
        this.elements.autoModeAllBtn.addEventListener('click', () => this.handleAutoModeAll());
        this.elements.systemDiagnosticsBtn.addEventListener('click', () => this.showSystemDiagnostics());
        
        // الدردشة
        this.elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
        this.elements.sendMessageBtn.addEventListener('click', () => this.sendChatMessage());
        
        // النوافذ المنبثقة
        this.elements.confirmYesBtn.addEventListener('click', () => this.confirmAction());
        this.elements.confirmNoBtn.addEventListener('click', () => this.closeConfirmModal());
        
        // إغلاق النوافذ المنبثقة عند النقر خارجها
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
        
        // اختصارات لوحة المفاتيح
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        console.log('🎯 تم إعداد مستمعي الأحداث');
    }
    
    /**
     * تهيئة اتصال WebSocket
     */
    initializeSocket() {
        try {
            console.log('🔌 بدء اتصال WebSocket...');
            
            this.socket = io({
                transports: ['websocket', 'polling'],
                upgrade: true,
                rememberUpgrade: true
            });
            
            // أحداث الاتصال
            this.socket.on('connect', () => this.onSocketConnect());
            this.socket.on('disconnect', () => this.onSocketDisconnect());
            this.socket.on('connect_error', (error) => this.onSocketError(error));
            
            // أحداث تسجيل الدخول
            this.socket.on('login_success', (data) => this.onLoginSuccess(data));
            this.socket.on('login_failed', (data) => this.onLoginFailed(data));
            
            // أحداث البيانات
            this.socket.on('data_update', (data) => this.onDataUpdate(data));
            this.socket.on('pump_updated', (data) => this.onPumpUpdated(data));
            
            // أحداث التنبيهات
            this.socket.on('new_alert', (data) => this.onNewAlert(data));
            
            // أحداث النشاط
            this.socket.on('new_activity', (data) => this.onNewActivity(data));
            
            // أحداث الدردشة
            this.socket.on('new_message', (data) => this.onNewMessage(data));
            
            // أحداث المستخدمين
            this.socket.on('user_connected', (data) => this.onUserConnected(data));
            this.socket.on('user_disconnected', (data) => this.onUserDisconnected(data));
            
            // أحداث العمليات الشاملة
            this.socket.on('emergency_stop_all', (data) => this.onEmergencyStopAll(data));
            this.socket.on('auto_mode_all', (data) => this.onAutoModeAll(data));
            
        } catch (error) {
            console.error('❌ خطأ في تهيئة WebSocket:', error);
            this.showToast('خطأ في الاتصال بالخادم', 'error');
        }
    }
    
    /**
     * معالج اتصال WebSocket
     */
    onSocketConnect() {
        console.log('✅ تم الاتصال بالخادم بنجاح');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.showToast('تم الاتصال بالخادم', 'success');
    }
    
    /**
     * معالج قطع اتصال WebSocket
     */
    onSocketDisconnect() {
        console.log('⚠️ تم قطع الاتصال بالخادم');
        this.isConnected = false;
        this.showToast('تم قطع الاتصال بالخادم', 'warning');
        this.attemptReconnect();
    }
    
    /**
     * معالج خطأ WebSocket
     */
    onSocketError(error) {
        console.error('❌ خطأ في اتصال WebSocket:', error);
        this.showToast('خطأ في الاتصال', 'error');
    }
    
    /**
     * محاولة إعادة الاتصال
     */
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 محاولة إعادة الاتصال ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            setTimeout(() => {
                if (!this.isConnected) {
                    this.socket.connect();
                }
            }, 3000 * this.reconnectAttempts);
        } else {
            console.error('❌ فشل في إعادة الاتصال بعد عدة محاولات');
            this.showToast('فشل في إعادة الاتصال. يرجى تحديث الصفحة.', 'error');
        }
    }
    
    /**
     * إخفاء شاشة التحميل
     */
    hideLoadingScreen() {
        this.elements.loadingScreen.style.opacity = '0';
        setTimeout(() => {
            this.elements.loadingScreen.style.display = 'none';
            this.elements.loginScreen.style.display = 'flex';
        }, 500);
    }
    
    /**
     * معالج تسجيل الدخول
     */
    handleLogin(event) {
        event.preventDefault();
        
        const employeeId = this.elements.employeeIdInput.value.trim();
        const password = this.elements.passwordInput.value.trim();
        
        if (!employeeId || !password) {
            this.showLoginError('يرجى إدخال جميع البيانات المطلوبة');
            return;
        }
        
        // إرسال بيانات تسجيل الدخول
        this.socket.emit('user_login', {
            employee_id: employeeId,
            password: password
        });
        
        // تعطيل النموذج مؤقتاً
        this.elements.loginForm.style.opacity = '0.7';
        this.elements.loginForm.style.pointerEvents = 'none';
    }
    
    /**
     * معالج نجاح تسجيل الدخول
     */
    onLoginSuccess(data) {
        console.log('✅ تم تسجيل الدخول بنجاح:', data.user.name);
        
        this.currentUser = data.user;
        
        // تحديث واجهة المستخدم
        this.elements.userNameSpan.textContent = data.user.name;
        this.elements.userRoleSpan.textContent = data.user.position;
        this.elements.userRoleSpan.className = `user-role ${data.user.role}`;
        
        // إخفاء شاشة تسجيل الدخول وإظهار التطبيق
        this.elements.loginScreen.style.display = 'none';
        this.elements.mainApp.style.display = 'block';
        
        // طلب تحديث البيانات
        this.socket.emit('request_data_update');
        
        // تحديث الوقت
        this.updateLastUpdateTime();
        
        this.showToast(`مرحباً ${data.user.name}`, 'success');
    }
    
    /**
     * معالج فشل تسجيل الدخول
     */
    onLoginFailed(data) {
        console.log('❌ فشل تسجيل الدخول:', data.error);
        
        this.showLoginError(data.error);
        
        // إعادة تفعيل النموذج
        this.elements.loginForm.style.opacity = '1';
        this.elements.loginForm.style.pointerEvents = 'auto';
        
        // مسح كلمة المرور
        this.elements.passwordInput.value = '';
        this.elements.passwordInput.focus();
    }
    
    /**
     * عرض خطأ تسجيل الدخول
     */
    showLoginError(message) {
        this.elements.loginError.textContent = message;
        this.elements.loginError.style.display = 'block';
        
        setTimeout(() => {
            this.elements.loginError.style.display = 'none';
        }, 5000);
    }
    
    /**
     * معالج تحديث البيانات
     */
    onDataUpdate(data) {
        console.log('📊 تحديث البيانات:', data);
        
        // تحديث بيانات المضخات
        if (data.pumps) {
            this.pumpsData = {};
            data.pumps.forEach(pump => {
                this.pumpsData[pump.id] = pump;
            });
            this.updatePumpsDisplay();
        }
        
        // تحديث صحة النظام
        if (data.system_health) {
            this.systemHealth = data.system_health;
            this.updateSystemHealthDisplay();
        }
        
        // تحديث عدد المستخدمين المتصلين
        if (data.users_online !== undefined) {
            this.elements.usersOnlineSpan.textContent = data.users_online;
        }
        
        // تحديث الوقت
        this.updateLastUpdateTime();
    }
    
    /**
     * تحديث عرض المضخات
     */
    updatePumpsDisplay() {
        const pumpsGrid = this.elements.pumpsGrid;
        pumpsGrid.innerHTML = '';
        
        Object.values(this.pumpsData).forEach(pump => {
            const pumpCard = this.createPumpCard(pump);
            pumpsGrid.appendChild(pumpCard);
        });
        
        // تحديث الإحصائيات
        this.updateStatistics();
    }
    
    /**
     * إنشاء بطاقة مضخة
     */
    createPumpCard(pump) {
        const card = document.createElement('div');
        card.className = `pump-card ${pump.status}`;
        card.dataset.pumpId = pump.id;
        
        // تحديد أيقونة الحالة
        let statusIcon, statusText, statusClass;
        switch (pump.status) {
            case 'running':
                statusIcon = 'fas fa-play-circle';
                statusText = 'قيد التشغيل';
                statusClass = 'running';
                break;
            case 'stopped':
                statusIcon = 'fas fa-stop-circle';
                statusText = 'متوقفة';
                statusClass = 'stopped';
                break;
            case 'emergency_stop':
                statusIcon = 'fas fa-exclamation-triangle';
                statusText = 'إيقاف طوارئ';
                statusClass = 'emergency';
                break;
            case 'maintenance':
                statusIcon = 'fas fa-tools';
                statusText = 'صيانة';
                statusClass = 'maintenance';
                break;
            case 'standby':
                statusIcon = 'fas fa-pause-circle';
                statusText = 'استعداد';
                statusClass = 'standby';
                break;
            default:
                statusIcon = 'fas fa-question-circle';
                statusText = 'غير محدد';
                statusClass = 'unknown';
        }
        
        // تحديد لون الكفاءة
        let efficiencyClass = 'good';
        if (pump.metrics.efficiency < 70) efficiencyClass = 'poor';
        else if (pump.metrics.efficiency < 85) efficiencyClass = 'average';
        
        // عدد التنبيهات
        const alertsCount = pump.alerts ? pump.alerts.length : 0;
        const alertsBadge = alertsCount > 0 ? `<span class="alerts-badge">${alertsCount}</span>` : '';
        
        card.innerHTML = `
            <div class="pump-header">
                <div class="pump-title">
                    <h3>${pump.name}</h3>
                    <span class="pump-type">${pump.type}</span>
                </div>
                <div class="pump-status ${statusClass}">
                    <i class="${statusIcon}"></i>
                    <span>${statusText}</span>
                    ${alertsBadge}
                </div>
            </div>
            
            <div class="pump-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${pump.location}</span>
            </div>
            
            <div class="pump-metrics">
                <div class="metric">
                    <div class="metric-label">الضغط</div>
                    <div class="metric-value">${pump.metrics.pressure} <span class="unit">بار</span></div>
                </div>
                <div class="metric">
                    <div class="metric-label">درجة الحرارة</div>
                    <div class="metric-value">${pump.metrics.temperature} <span class="unit">°م</span></div>
                </div>
                <div class="metric">
                    <div class="metric-label">معدل التدفق</div>
                    <div class="metric-value">${pump.metrics.flow_rate} <span class="unit">ل/د</span></div>
                </div>
                <div class="metric">
                    <div class="metric-label">الكفاءة</div>
                    <div class="metric-value ${efficiencyClass}">${pump.metrics.efficiency} <span class="unit">%</span></div>
                </div>
            </div>
            
            <div class="pump-controls">
                <button class="control-btn start ${pump.status === 'running' || pump.emergency_stop ? 'disabled' : ''}" 
                        onclick="pumpSystem.controlPump(${pump.id}, 'start')" 
                        title="تشغيل المضخة"
                        ${pump.status === 'running' || pump.emergency_stop ? 'disabled' : ''}>
                    <i class="fas fa-play"></i>
                </button>
                
                <button class="control-btn stop ${pump.status === 'stopped' ? 'disabled' : ''}" 
                        onclick="pumpSystem.controlPump(${pump.id}, 'stop')" 
                        title="إيقاف المضخة"
                        ${pump.status === 'stopped' ? 'disabled' : ''}>
                    <i class="fas fa-stop"></i>
                </button>
                
                <button class="control-btn emergency" 
                        onclick="pumpSystem.controlPump(${pump.id}, 'emergency_stop')" 
                        title="إيقاف طوارئ">
                    <i class="fas fa-exclamation-triangle"></i>
                </button>
                
                <button class="control-btn auto ${pump.auto_mode ? 'active' : ''}" 
                        onclick="pumpSystem.controlPump(${pump.id}, 'auto')" 
                        title="الوضع التلقائي">
                    <i class="fas fa-magic"></i>
                </button>
                
                <button class="control-btn standby ${pump.status === 'standby' ? 'disabled' : ''}" 
                        onclick="pumpSystem.controlPump(${pump.id}, 'standby')" 
                        title="وضع الاستعداد"
                        ${pump.status === 'standby' ? 'disabled' : ''}>
                    <i class="fas fa-pause"></i>
                </button>
                
                <button class="control-btn maintenance ${pump.status === 'maintenance' ? 'disabled' : ''}" 
                        onclick="pumpSystem.controlPump(${pump.id}, 'maintenance')" 
                        title="وضع الصيانة"
                        ${pump.status === 'maintenance' ? 'disabled' : ''}>
                    <i class="fas fa-tools"></i>
                </button>
                
                ${pump.emergency_stop ? `
                <button class="control-btn reset" 
                        onclick="pumpSystem.controlPump(${pump.id}, 'reset_emergency')" 
                        title="إعادة تعيين إيقاف الطوارئ">
                    <i class="fas fa-redo"></i>
                </button>
                ` : ''}
            </div>
            
            <div class="pump-footer">
                <button class="details-btn" onclick="pumpSystem.showPumpDetails(${pump.id})">
                    <i class="fas fa-info-circle"></i>
                    تفاصيل أكثر
                </button>
            </div>
        `;
        
        // إضافة حدث النقر على البطاقة
        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                this.showPumpDetails(pump.id);
            }
        });
        
        return card;
    }
    
    /**
     * التحكم في مضخة
     */
    controlPump(pumpId, action) {
        if (!this.currentUser) {
            this.showToast('يجب تسجيل الدخول أولاً', 'error');
            return;
        }
        
        const pump = this.pumpsData[pumpId];
        if (!pump) {
            this.showToast('المضخة غير موجودة', 'error');
            return;
        }
        
        // تأكيد العمليات الحساسة
        if (action === 'emergency_stop') {
            this.showConfirmModal(
                'تأكيد إيقاف الطوارئ',
                `هل أنت متأكد من إيقاف الطوارئ لـ ${pump.name}؟`,
                () => this.executePumpControl(pumpId, action)
            );
            return;
        }
        
        this.executePumpControl(pumpId, action);
    }
    
    /**
     * تنفيذ التحكم في المضخة
     */
    executePumpControl(pumpId, action) {
        fetch(`/api/pumps/${pumpId}/control`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: action,
                user_id: this.currentUser.name
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showToast(data.message, 'success');
            } else {
                this.showToast(data.error, 'error');
            }
        })
        .catch(error => {
            console.error('خطأ في التحكم بالمضخة:', error);
            this.showToast('خطأ في التحكم بالمضخة', 'error');
        });
    }
    
    /**
     * معالج تحديث المضخة
     */
    onPumpUpdated(data) {
        console.log('🔄 تحديث المضخة:', data);
        
        // تحديث بيانات المضخة
        this.pumpsData[data.pump_id] = data.pump;
        
        // تحديث العرض
        this.updatePumpsDisplay();
        
        // إظهار رسالة
        if (data.user !== this.currentUser.name) {
            this.showToast(`${data.message} بواسطة ${data.user}`, 'info');
        }
    }
    
    /**
     * معالج إيقاف الطوارئ الشامل
     */
    handleEmergencyStopAll() {
        this.showConfirmModal(
            'تأكيد إيقاف الطوارئ الشامل',
            'هل أنت متأكد من إيقاف الطوارئ لجميع المضخات؟ هذا الإجراء سيوقف جميع المضخات العاملة فوراً.',
            () => this.executeEmergencyStopAll()
        );
    }
    
    /**
     * تنفيذ إيقاف الطوارئ الشامل
     */
    executeEmergencyStopAll() {
        fetch('/api/emergency/all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: this.currentUser.name
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showToast(data.message, 'warning');
            } else {
                this.showToast(data.error, 'error');
            }
        })
        .catch(error => {
            console.error('خطأ في إيقاف الطوارئ الشامل:', error);
            this.showToast('خطأ في إيقاف الطوارئ الشامل', 'error');
        });
    }
    
    /**
     * معالج الوضع التلقائي الشامل
     */
    handleAutoModeAll() {
        this.showConfirmModal(
            'تأكيد الوضع التلقائي الشامل',
            'هل أنت متأكد من تفعيل الوضع التلقائي لجميع المضخات؟',
            () => this.executeAutoModeAll()
        );
    }
    
    /**
     * تنفيذ الوضع التلقائي الشامل
     */
    executeAutoModeAll() {
        fetch('/api/auto/all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: this.currentUser.name
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showToast(data.message, 'success');
            } else {
                this.showToast(data.error, 'error');
            }
        })
        .catch(error => {
            console.error('خطأ في الوضع التلقائي الشامل:', error);
            this.showToast('خطأ في الوضع التلقائي الشامل', 'error');
        });
    }
    
    /**
     * معالج إيقاف الطوارئ الشامل من الخادم
     */
    onEmergencyStopAll(data) {
        console.log('🚨 إيقاف طوارئ شامل:', data);
        
        // تحديث بيانات المضخات
        data.pumps.forEach(pump => {
            this.pumpsData[pump.id] = pump;
        });
        
        // تحديث العرض
        this.updatePumpsDisplay();
        
        // إظهار رسالة
        if (data.user !== this.currentUser.name) {
            this.showToast(`${data.message} بواسطة ${data.user}`, 'warning');
        }
    }
    
    /**
     * معالج الوضع التلقائي الشامل من الخادم
     */
    onAutoModeAll(data) {
        console.log('🤖 وضع تلقائي شامل:', data);
        
        // تحديث بيانات المضخات
        data.pumps.forEach(pump => {
            this.pumpsData[pump.id] = pump;
        });
        
        // تحديث العرض
        this.updatePumpsDisplay();
        
        // إظهار رسالة
        if (data.user !== this.currentUser.name) {
            this.showToast(`${data.message} بواسطة ${data.user}`, 'info');
        }
    }
    
    /**
     * تحديث عرض صحة النظام
     */
    updateSystemHealthDisplay() {
        if (!this.systemHealth) return;
        
        // تحديث النقاط
        this.elements.healthScoreSpan.textContent = `${this.systemHealth.score}%`;
        this.elements.sidebarHealthScore.textContent = this.systemHealth.score;
        
        // تحديث الحالة
        this.elements.systemStatusSpan.textContent = this.systemHealth.status_ar || this.systemHealth.status;
        this.elements.systemStatusSpan.className = `status-value ${this.systemHealth.status}`;
        
        // تحديث دائرة الصحة
        const healthCircle = this.elements.sidebarHealthScore.parentElement;
        healthCircle.className = `health-circle ${this.systemHealth.status}`;
    }
    
    /**
     * تحديث الإحصائيات
     */
    updateStatistics() {
        const pumps = Object.values(this.pumpsData);
        
        // عدد المضخات العاملة
        const runningPumps = pumps.filter(p => p.status === 'running').length;
        const totalPumps = pumps.length;
        this.elements.runningPumpsSpan.textContent = `${runningPumps}/${totalPumps}`;
        
        // متوسط الكفاءة
        const runningEfficiencies = pumps
            .filter(p => p.status === 'running')
            .map(p => p.metrics.efficiency);
        const avgEfficiency = runningEfficiencies.length > 0 
            ? Math.round(runningEfficiencies.reduce((a, b) => a + b, 0) / runningEfficiencies.length)
            : 0;
        this.elements.avgEfficiencySpan.textContent = `${avgEfficiency}%`;
        
        // عدد التنبيهات النشطة
        const activeAlerts = pumps.reduce((total, pump) => total + (pump.alerts ? pump.alerts.length : 0), 0);
        this.elements.activeAlertsSpan.textContent = activeAlerts;
        
        // تحديث قائمة التنبيهات
        this.updateAlertsList();
    }
    
    /**
     * تحديث قائمة التنبيهات
     */
    updateAlertsList() {
        const alertsList = this.elements.alertsList;
        alertsList.innerHTML = '';
        
        // جمع جميع التنبيهات
        const allAlerts = [];
        Object.values(this.pumpsData).forEach(pump => {
            if (pump.alerts) {
                pump.alerts.forEach(alert => {
                    alert.pump_name = pump.name;
                    alert.pump_id = pump.id;
                    allAlerts.push(alert);
                });
            }
        });
        
        // ترتيب حسب الأولوية
        allAlerts.sort((a, b) => {
            const severityOrder = { critical: 0, warning: 1, info: 2 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });
        
        // عرض التنبيهات
        if (allAlerts.length === 0) {
            alertsList.innerHTML = '<div class="no-alerts">لا توجد تنبيهات نشطة</div>';
        } else {
            allAlerts.slice(0, 5).forEach(alert => {
                const alertElement = this.createAlertElement(alert);
                alertsList.appendChild(alertElement);
            });
            
            if (allAlerts.length > 5) {
                const moreElement = document.createElement('div');
                moreElement.className = 'more-alerts';
                moreElement.textContent = `و ${allAlerts.length - 5} تنبيهات أخرى...`;
                alertsList.appendChild(moreElement);
            }
        }
    }
    
    /**
     * إنشاء عنصر تنبيه
     */
    createAlertElement(alert) {
        const element = document.createElement('div');
        element.className = `alert-item ${alert.severity}`;
        element.onclick = () => this.showAlertDetails(alert);
        
        let icon;
        switch (alert.severity) {
            case 'critical':
                icon = 'fas fa-exclamation-circle';
                break;
            case 'warning':
                icon = 'fas fa-exclamation-triangle';
                break;
            default:
                icon = 'fas fa-info-circle';
        }
        
        element.innerHTML = `
            <div class="alert-icon">
                <i class="${icon}"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">${alert.message}</div>
                <div class="alert-pump">${alert.pump_name}</div>
                <div class="alert-time">${this.formatTime(alert.timestamp)}</div>
            </div>
        `;
        
        return element;
    }
    
    /**
     * معالج تنبيه جديد
     */
    onNewAlert(data) {
        console.log('🚨 تنبيه جديد:', data);
        
        // تحديث بيانات المضخة
        if (this.pumpsData[data.pump_id]) {
            // إضافة التنبيه إلى قائمة تنبيهات المضخة
            if (!this.pumpsData[data.pump_id].alerts) {
                this.pumpsData[data.pump_id].alerts = [];
            }
            this.pumpsData[data.pump_id].alerts.push(data.alert);
        }
        
        // تحديث العرض
        this.updatePumpsDisplay();
        
        // إظهار إشعار
        this.showToast(`تنبيه جديد: ${data.alert.message}`, 'warning');
        
        // تشغيل صوت تنبيه (اختياري)
        this.playAlertSound(data.alert.severity);
    }
    
    /**
     * تشغيل صوت تنبيه
     */
    playAlertSound(severity) {
        try {
            // إنشاء صوت تنبيه بسيط
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // تحديد تردد الصوت حسب الأولوية
            oscillator.frequency.value = severity === 'critical' ? 800 : 600;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('لا يمكن تشغيل صوت التنبيه:', error);
        }
    }
    
    /**
     * عرض تفاصيل التنبيه
     */
    showAlertDetails(alert) {
        this.elements.alertModalTitle.textContent = alert.message;
        
        this.elements.alertModalContent.innerHTML = `
            <div class="alert-details">
                <div class="alert-severity ${alert.severity}">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${this.getSeverityText(alert.severity)}</span>
                </div>
                
                <div class="alert-description">
                    <h4>الوصف:</h4>
                    <p>${alert.description}</p>
                </div>
                
                <div class="alert-cause">
                    <h4>السبب المحتمل:</h4>
                    <p>${alert.cause}</p>
                </div>
                
                ${alert.image ? `
                <div class="alert-image">
                    <h4>صورة توضيحية:</h4>
                    <img src="${alert.image}" alt="صورة توضيحية للعطل" onerror="this.style.display='none'">
                </div>
                ` : ''}
                
                <div class="alert-recommendations">
                    <h4>التوصيات:</h4>
                    <ul>
                        ${alert.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="alert-timestamp">
                    <strong>وقت التنبيه:</strong> ${this.formatDateTime(alert.timestamp)}
                </div>
            </div>
        `;
        
        this.elements.alertModal.style.display = 'flex';
    }
    
    /**
     * الحصول على نص الأولوية
     */
    getSeverityText(severity) {
        switch (severity) {
            case 'critical': return 'حرج';
            case 'warning': return 'تحذير';
            case 'info': return 'معلومات';
            default: return 'غير محدد';
        }
    }
    
    /**
     * عرض تفاصيل المضخة
     */
    showPumpDetails(pumpId) {
        const pump = this.pumpsData[pumpId];
        if (!pump) return;
        
        this.elements.pumpModalTitle.textContent = `تفاصيل ${pump.name}`;
        
        this.elements.pumpModalContent.innerHTML = `
            <div class="pump-details">
                <div class="pump-info-grid">
                    <div class="info-section">
                        <h4>معلومات عامة</h4>
                        <div class="info-item">
                            <span class="label">الاسم:</span>
                            <span class="value">${pump.name}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">النوع:</span>
                            <span class="value">${pump.type}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">الموقع:</span>
                            <span class="value">${pump.location}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">الحالة:</span>
                            <span class="value status-${pump.status}">${this.getStatusText(pump.status)}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">الوضع التلقائي:</span>
                            <span class="value">${pump.auto_mode ? 'مفعل' : 'معطل'}</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h4>المقاييس الحالية</h4>
                        <div class="metrics-grid">
                            <div class="metric-card">
                                <div class="metric-icon"><i class="fas fa-tachometer-alt"></i></div>
                                <div class="metric-info">
                                    <div class="metric-label">الضغط</div>
                                    <div class="metric-value">${pump.metrics.pressure} بار</div>
                                </div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-icon"><i class="fas fa-thermometer-half"></i></div>
                                <div class="metric-info">
                                    <div class="metric-label">درجة الحرارة</div>
                                    <div class="metric-value">${pump.metrics.temperature} °م</div>
                                </div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-icon"><i class="fas fa-water"></i></div>
                                <div class="metric-info">
                                    <div class="metric-label">معدل التدفق</div>
                                    <div class="metric-value">${pump.metrics.flow_rate} ل/د</div>
                                </div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-icon"><i class="fas fa-wave-square"></i></div>
                                <div class="metric-info">
                                    <div class="metric-label">الاهتزاز</div>
                                    <div class="metric-value">${pump.metrics.vibration} مم/ث</div>
                                </div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-icon"><i class="fas fa-bolt"></i></div>
                                <div class="metric-info">
                                    <div class="metric-label">الطاقة</div>
                                    <div class="metric-value">${pump.metrics.power} %</div>
                                </div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-icon"><i class="fas fa-chart-line"></i></div>
                                <div class="metric-info">
                                    <div class="metric-label">الكفاءة</div>
                                    <div class="metric-value">${pump.metrics.efficiency} %</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h4>معلومات الإنتاج والصيانة</h4>
                    <div class="production-info">
                        <div class="info-item">
                            <span class="label">الإنتاج اليوم:</span>
                            <span class="value">${pump.production_today.toFixed(1)} لتر</span>
                        </div>
                        <div class="info-item">
                            <span class="label">إجمالي ساعات التشغيل:</span>
                            <span class="value">${pump.total_runtime.toLocaleString()} ساعة</span>
                        </div>
                        <div class="info-item">
                            <span class="label">آخر صيانة:</span>
                            <span class="value">${this.formatDate(pump.last_maintenance)}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">الصيانة القادمة:</span>
                            <span class="value">${this.formatDate(pump.next_maintenance)}</span>
                        </div>
                    </div>
                </div>
                
                ${pump.alerts && pump.alerts.length > 0 ? `
                <div class="info-section">
                    <h4>التنبيهات النشطة (${pump.alerts.length})</h4>
                    <div class="pump-alerts">
                        ${pump.alerts.map(alert => `
                            <div class="alert-item ${alert.severity}" onclick="pumpSystem.showAlertDetails(${JSON.stringify(alert).replace(/"/g, '&quot;')})">
                                <div class="alert-icon">
                                    <i class="fas fa-exclamation-triangle"></i>
                                </div>
                                <div class="alert-content">
                                    <div class="alert-title">${alert.message}</div>
                                    <div class="alert-time">${this.formatTime(alert.timestamp)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        this.elements.pumpModal.style.display = 'flex';
    }
    
    /**
     * الحصول على نص الحالة
     */
    getStatusText(status) {
        switch (status) {
            case 'running': return 'قيد التشغيل';
            case 'stopped': return 'متوقفة';
            case 'emergency_stop': return 'إيقاف طوارئ';
            case 'maintenance': return 'صيانة';
            case 'standby': return 'استعداد';
            default: return 'غير محدد';
        }
    }
    
    /**
     * معالج نشاط جديد
     */
    onNewActivity(activity) {
        console.log('📝 نشاط جديد:', activity);
        this.addActivityToLog(activity);
    }
    
    /**
     * إضافة نشاط إلى السجل
     */
    addActivityToLog(activity) {
        const activityLog = this.elements.activityLog;
        
        // إنشاء عنصر النشاط
        const activityElement = document.createElement('div');
        activityElement.className = `activity-item ${activity.type}`;
        
        let icon;
        switch (activity.type) {
            case 'operation':
                icon = 'fas fa-cogs';
                break;
            case 'emergency':
                icon = 'fas fa-exclamation-triangle';
                break;
            case 'configuration':
                icon = 'fas fa-sliders-h';
                break;
            case 'info':
                icon = 'fas fa-info-circle';
                break;
            default:
                icon = 'fas fa-circle';
        }
        
        activityElement.innerHTML = `
            <div class="activity-icon">
                <i class="${icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-message">${activity.message}</div>
                <div class="activity-meta">
                    <span class="activity-user">${activity.user}</span>
                    <span class="activity-time">${this.formatTime(activity.timestamp)}</span>
                </div>
            </div>
        `;
        
        // إضافة في المقدمة
        activityLog.insertBefore(activityElement, activityLog.firstChild);
        
        // الاحتفاظ بآخر 20 نشاط فقط
        while (activityLog.children.length > 20) {
            activityLog.removeChild(activityLog.lastChild);
        }
    }
    
    /**
     * معالج رسالة جديدة
     */
    onNewMessage(message) {
        console.log('💬 رسالة جديدة:', message);
        this.addMessageToChat(message);
    }
    
    /**
     * إضافة رسالة إلى الدردشة
     */
    addMessageToChat(message) {
        const chatMessages = this.elements.chatMessages;
        
        // إنشاء عنصر الرسالة
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${message.user === this.currentUser.name ? 'own' : 'other'}`;
        
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-user">${message.user}</span>
                <span class="message-role ${message.user_role}">${this.getRoleText(message.user_role)}</span>
                <span class="message-time">${this.formatTime(message.timestamp)}</span>
            </div>
            <div class="message-content">${this.escapeHtml(message.message)}</div>
        `;
        
        // إضافة في النهاية
        chatMessages.appendChild(messageElement);
        
        // التمرير إلى الأسفل
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // الاحتفاظ بآخر 50 رسالة فقط
        while (chatMessages.children.length > 50) {
            chatMessages.removeChild(chatMessages.firstChild);
        }
    }
    
    /**
     * إرسال رسالة دردشة
     */
    sendChatMessage() {
        const message = this.elements.chatInput.value.trim();
        if (!message) return;
        
        if (!this.currentUser) {
            this.showToast('يجب تسجيل الدخول أولاً', 'error');
            return;
        }
        
        // إرسال الرسالة
        this.socket.emit('send_message', {
            message: message
        });
        
        // مسح حقل الإدخال
        this.elements.chatInput.value = '';
    }
    
    /**
     * الحصول على نص الدور
     */
    getRoleText(role) {
        switch (role) {
            case 'admin': return 'مدير';
            case 'operator': return 'مشغل';
            case 'engineer': return 'مهندس';
            default: return 'مستخدم';
        }
    }
    
    /**
     * معالج اتصال مستخدم جديد
     */
    onUserConnected(data) {
        console.log('👤 مستخدم جديد متصل:', data.user.name);
        this.elements.usersOnlineSpan.textContent = data.users_online;
        this.showToast(`انضم ${data.user.name} إلى النظام`, 'info');
    }
    
    /**
     * معالج قطع اتصال مستخدم
     */
    onUserDisconnected(data) {
        console.log('👤 مستخدم قطع الاتصال:', data.user.name);
        this.elements.usersOnlineSpan.textContent = data.users_online;
        this.showToast(`غادر ${data.user.name} النظام`, 'info');
    }
    
    /**
     * تحديث البيانات
     */
    refreshData() {
        if (this.socket && this.isConnected) {
            this.socket.emit('request_data_update');
            this.showToast('تم تحديث البيانات', 'success');
        } else {
            this.showToast('لا يوجد اتصال بالخادم', 'error');
        }
    }
    
    /**
     * تسجيل الخروج
     */
    handleLogout() {
        this.showConfirmModal(
            'تأكيد تسجيل الخروج',
            'هل أنت متأكد من تسجيل الخروج؟',
            () => this.executeLogout()
        );
    }
    
    /**
     * تنفيذ تسجيل الخروج
     */
    executeLogout() {
        // قطع اتصال WebSocket
        if (this.socket) {
            this.socket.disconnect();
        }
        
        // مسح البيانات
        this.currentUser = null;
        this.pumpsData = {};
        this.systemHealth = {};
        
        // إعادة تعيين النموذج
        this.elements.loginForm.reset();
        this.elements.loginError.style.display = 'none';
        
        // إظهار شاشة تسجيل الدخول
        this.elements.mainApp.style.display = 'none';
        this.elements.loginScreen.style.display = 'flex';
        
        // إعادة تهيئة الاتصال
        setTimeout(() => {
            this.initializeSocket();
        }, 1000);
        
        this.showToast('تم تسجيل الخروج بنجاح', 'info');
    }
    
    /**
     * عرض تشخيص النظام
     */
    showSystemDiagnostics() {
        // جمع معلومات التشخيص
        const pumps = Object.values(this.pumpsData);
        const runningPumps = pumps.filter(p => p.status === 'running').length;
        const stoppedPumps = pumps.filter(p => p.status === 'stopped').length;
        const emergencyPumps = pumps.filter(p => p.status === 'emergency_stop').length;
        const maintenancePumps = pumps.filter(p => p.status === 'maintenance').length;
        
        const totalAlerts = pumps.reduce((total, pump) => total + (pump.alerts ? pump.alerts.length : 0), 0);
        const criticalAlerts = pumps.reduce((total, pump) => {
            return total + (pump.alerts ? pump.alerts.filter(a => a.severity === 'critical').length : 0);
        }, 0);
        
        const avgEfficiency = pumps.length > 0 
            ? Math.round(pumps.reduce((total, pump) => total + pump.metrics.efficiency, 0) / pumps.length)
            : 0;
        
        const totalProduction = pumps.reduce((total, pump) => total + pump.production_today, 0);
        
        // عرض النافذة المنبثقة
        this.elements.pumpModalTitle.textContent = 'تشخيص النظام الشامل';
        
        this.elements.pumpModalContent.innerHTML = `
            <div class="system-diagnostics">
                <div class="diagnostics-grid">
                    <div class="diagnostic-section">
                        <h4><i class="fas fa-chart-pie"></i> إحصائيات المضخات</h4>
                        <div class="stats-grid">
                            <div class="stat-item running">
                                <div class="stat-value">${runningPumps}</div>
                                <div class="stat-label">مضخات عاملة</div>
                            </div>
                            <div class="stat-item stopped">
                                <div class="stat-value">${stoppedPumps}</div>
                                <div class="stat-label">مضخات متوقفة</div>
                            </div>
                            <div class="stat-item emergency">
                                <div class="stat-value">${emergencyPumps}</div>
                                <div class="stat-label">إيقاف طوارئ</div>
                            </div>
                            <div class="stat-item maintenance">
                                <div class="stat-value">${maintenancePumps}</div>
                                <div class="stat-label">صيانة</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="diagnostic-section">
                        <h4><i class="fas fa-exclamation-triangle"></i> التنبيهات</h4>
                        <div class="alerts-stats">
                            <div class="alert-stat critical">
                                <span class="count">${criticalAlerts}</span>
                                <span class="label">تنبيهات حرجة</span>
                            </div>
                            <div class="alert-stat total">
                                <span class="count">${totalAlerts}</span>
                                <span class="label">إجمالي التنبيهات</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="diagnostic-section">
                        <h4><i class="fas fa-chart-line"></i> الأداء</h4>
                        <div class="performance-stats">
                            <div class="perf-item">
                                <span class="label">متوسط الكفاءة:</span>
                                <span class="value ${avgEfficiency >= 85 ? 'good' : avgEfficiency >= 70 ? 'average' : 'poor'}">${avgEfficiency}%</span>
                            </div>
                            <div class="perf-item">
                                <span class="label">الإنتاج اليوم:</span>
                                <span class="value">${totalProduction.toFixed(1)} لتر</span>
                            </div>
                            <div class="perf-item">
                                <span class="label">نقاط صحة النظام:</span>
                                <span class="value ${this.systemHealth.status}">${this.systemHealth.score}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="diagnostic-section">
                        <h4><i class="fas fa-network-wired"></i> حالة الاتصال</h4>
                        <div class="connection-stats">
                            <div class="conn-item">
                                <span class="label">حالة الخادم:</span>
                                <span class="value ${this.isConnected ? 'connected' : 'disconnected'}">
                                    ${this.isConnected ? 'متصل' : 'غير متصل'}
                                </span>
                            </div>
                            <div class="conn-item">
                                <span class="label">المستخدمون المتصلون:</span>
                                <span class="value">${this.elements.usersOnlineSpan.textContent}</span>
                            </div>
                            <div class="conn-item">
                                <span class="label">آخر تحديث:</span>
                                <span class="value">${this.elements.lastUpdateSpan.textContent}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="diagnostic-recommendations">
                    <h4><i class="fas fa-lightbulb"></i> التوصيات</h4>
                    <ul>
                        ${criticalAlerts > 0 ? '<li class="critical">يوجد تنبيهات حرجة تتطلب اهتماماً فورياً</li>' : ''}
                        ${emergencyPumps > 0 ? '<li class="warning">يوجد مضخات في حالة إيقاف طوارئ</li>' : ''}
                        ${avgEfficiency < 70 ? '<li class="warning">متوسط الكفاءة منخفض، يُنصح بالصيانة</li>' : ''}
                        ${runningPumps === 0 ? '<li class="critical">لا توجد مضخات عاملة حالياً</li>' : ''}
                        ${totalAlerts === 0 && avgEfficiency >= 85 ? '<li class="success">النظام يعمل بكفاءة عالية</li>' : ''}
                    </ul>
                </div>
            </div>
        `;
        
        this.elements.pumpModal.style.display = 'flex';
    }
    
    /**
     * عرض نافذة التأكيد
     */
    showConfirmModal(title, message, onConfirm) {
        this.elements.confirmModalTitle.textContent = title;
        this.elements.confirmModalMessage.textContent = message;
        
        this.confirmCallback = onConfirm;
        this.elements.confirmModal.style.display = 'flex';
    }
    
    /**
     * تأكيد العملية
     */
    confirmAction() {
        if (this.confirmCallback) {
            this.confirmCallback();
            this.confirmCallback = null;
        }
        this.closeConfirmModal();
    }
    
    /**
     * إغلاق نافذة التأكيد
     */
    closeConfirmModal() {
        this.elements.confirmModal.style.display = 'none';
        this.confirmCallback = null;
    }
    
    /**
     * إغلاق جميع النوافذ المنبثقة
     */
    closeAllModals() {
        this.elements.alertModal.style.display = 'none';
        this.elements.pumpModal.style.display = 'none';
        this.elements.confirmModal.style.display = 'none';
    }
    
    /**
     * عرض إشعار
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon;
        switch (type) {
            case 'success':
                icon = 'fas fa-check-circle';
                break;
            case 'error':
                icon = 'fas fa-times-circle';
                break;
            case 'warning':
                icon = 'fas fa-exclamation-triangle';
                break;
            default:
                icon = 'fas fa-info-circle';
        }
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icon}"></i>
            </div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        // إزالة الإشعار تلقائياً بعد 5 ثوان
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
    
    /**
     * معالج اختصارات لوحة المفاتيح
     */
    handleKeyboardShortcuts(event) {
        // Escape لإغلاق النوافذ المنبثقة
        if (event.key === 'Escape') {
            this.closeAllModals();
        }
        
        // F5 لتحديث البيانات
        if (event.key === 'F5') {
            event.preventDefault();
            this.refreshData();
        }
        
        // Ctrl+L لتسجيل الخروج
        if (event.ctrlKey && event.key === 'l') {
            event.preventDefault();
            this.handleLogout();
        }
    }
    
    /**
     * تحديث وقت آخر تحديث
     */
    updateLastUpdateTime() {
        const now = new Date();
        this.elements.lastUpdateSpan.textContent = this.formatTime(now.toISOString());
    }
    
    /**
     * تنسيق الوقت
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    /**
     * تنسيق التاريخ والوقت
     */
    formatDateTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('ar-SA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    /**
     * تنسيق التاريخ
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
    
    /**
     * تشفير HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// إنشاء النظام عند تحميل الصفحة
let pumpSystem;
document.addEventListener('DOMContentLoaded', () => {
    pumpSystem = new OilPumpMonitoringSystem();
});

// دوال عامة للوصول من HTML
function closeAlertModal() {
    if (pumpSystem) {
        pumpSystem.elements.alertModal.style.display = 'none';
    }
}

function closePumpModal() {
    if (pumpSystem) {
        pumpSystem.elements.pumpModal.style.display = 'none';
    }
}

// تصدير النظام للاستخدام العام
window.pumpSystem = pumpSystem;

