import { AppSettings, OvertimeEntry } from '../types';
import { format } from 'date-fns';

class NotificationService {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações.');
      return false;
    }
    
    if (Notification.permission === 'granted') return true;
    
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      // Fallback para navegadores que usam callback em vez de Promise
      return new Promise((resolve) => {
        Notification.requestPermission((permission) => {
          resolve(permission === 'granted');
        });
      });
    }
  }

  send(title: string, body: string) {
    // Always trigger an internal event as fallback/backup
    window.dispatchEvent(new CustomEvent('jornada-notify', { 
      detail: { title, body } 
    }));

    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      try {
        const n = new Notification(title, {
          body,
          icon: 'https://cdn-icons-png.flaticon.com/512/599/599295.png', // Relógio icon
          badge: 'https://cdn-icons-png.flaticon.com/512/599/599295.png',
          silent: false,
        });

        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch (e) {
        console.error('Falha ao disparar notificação:', e);
        // Fallback: Mostrar no console durante o dev se falhar por restrição de iframe
        console.info(`[JORNADA+] Notificação: ${title} - ${body}`);
      }
    } else {
      console.warn('Permissão de notificação não concedida.');
    }
  }

  testNotification() {
    this.send(
      '🔔 Teste de Notificação', 
      'Se você está vendo isso, as notificações do Jornada+ estão funcionando!'
    );
  }

  checkMonthlyLimit(entries: OvertimeEntry[], settings: AppSettings) {
    if (!settings.notificationsEnabled) return;

    const totalHours = entries.reduce((acc, curr) => acc + curr.calculatedHours, 0);
    const limit = settings.monthlyLimit;
    if (limit <= 0) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const lastLimitAlert = localStorage.getItem('last_limit_alert_date');

    if (totalHours >= limit) {
      if (lastLimitAlert !== today + '_100') {
        this.send(
          '🚀 Limite Atingido!', 
          `Você completou suas ${limit}h extras mensais. Ótimo trabalho!`
        );
        localStorage.setItem('last_limit_alert_date', today + '_100');
      }
    } else if (totalHours >= limit * 0.8) {
      if (lastLimitAlert !== today + '_80') {
        this.send(
          '⚠️ Quase lá!', 
          `Você atingiu 80% da sua meta mensal (${totalHours.toFixed(1)}h de ${limit}h).`
        );
        localStorage.setItem('last_limit_alert_date', today + '_80');
      }
    }
  }

  checkDailyReminder(entries: OvertimeEntry[], settings: AppSettings) {
    if (!settings.notificationsEnabled) return;

    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const currentTime = format(now, 'HH:mm');
    
    if (currentTime >= settings.reminderTime) {
      const lastReminder = localStorage.getItem('last_daily_reminder_date');
      if (lastReminder === today) return;

      const hasEntryToday = entries.some(e => e.date === today);
      if (!hasEntryToday) {
        this.send(
          '🕒 Lembrete Jornada+', 
          'Não se esqueça de registrar suas horas extras de hoje!'
        );
        localStorage.setItem('last_daily_reminder_date', today);
      }
    }
  }
}

export const notificationService = new NotificationService();
