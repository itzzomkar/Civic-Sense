import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private connected = false;

  connect(userId?: string) {
    if (this.socket && this.connected) {
      return;
    }

    const serverUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:5000';

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to server:', this.socket?.id);
      this.connected = true;
      
      if (userId) {
        this.joinRoom(`user-${userId}`);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  joinRoom(roomId: string) {
    if (this.socket && this.connected) {
      this.socket.emit('join-room', roomId);
    }
  }

  leaveRoom(roomId: string) {
    if (this.socket && this.connected) {
      this.socket.emit('leave-room', roomId);
    }
  }

  // Report-related events
  emitReportUpdate(reportId: string, status: string, roomId: string) {
    if (this.socket && this.connected) {
      this.socket.emit('report-update', {
        reportId,
        status,
        roomId,
        timestamp: new Date().toISOString()
      });
    }
  }

  emitNewReport(reportData: any) {
    if (this.socket && this.connected) {
      this.socket.emit('new-report', {
        ...reportData,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Event listeners
  onReportStatusChanged(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('report-status-changed', callback);
    }
  }

  onNewReportNotification(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('new-report-notification', callback);
    }
  }

  // Remove event listeners
  removeListener(eventName: string, callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(eventName, callback);
      } else {
        this.socket.off(eventName);
      }
    }
  }

  // Utility methods
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  getSocketId() {
    return this.socket?.id;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;