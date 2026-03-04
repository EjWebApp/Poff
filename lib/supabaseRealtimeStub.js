// Realtime 미사용 - React Native 호환용 스텁 (Auth, DB만 사용)
class RealtimeClientStub {
  constructor() {}
  setAuth() {}
  channel() {
    return { subscribe: () => {}, unsubscribe: () => {} };
  }
  getChannels() {
    return [];
  }
  removeChannel() {
    return Promise.resolve('ok');
  }
  removeAllChannels() {
    return Promise.resolve('ok');
  }
}

export const RealtimeClient = RealtimeClientStub;
export const RealtimeChannel = function () {};
export const RealtimePresence = function () {};
export default { RealtimeClient, RealtimeChannel, RealtimePresence };
