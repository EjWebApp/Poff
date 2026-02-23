import { Bell, BellOff, AlertCircle } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type PermissionStatusType =
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported'
  | 'checking';

interface PermissionStatusProps {
  permission: PermissionStatusType;
}

export function PermissionStatus({ permission }: PermissionStatusProps) {
  const getIcon = () => {
    switch (permission) {
      case 'granted':
        return <Bell size={14} color="#4ade80" />;
      case 'denied':
        return <BellOff size={14} color="#f87171" />;
      case 'unsupported':
        return <AlertCircle size={14} color="#facc15" />;
      default:
        return <Bell size={14} color="rgba(255,255,255,0.4)" />;
    }
  };

  const getText = () => {
    switch (permission) {
      case 'granted':
        return '알림 허용됨';
      case 'denied':
        return '알림 차단됨';
      case 'unsupported':
        return '알림 미지원';
      case 'checking':
        return '확인중...';
      default:
        return '알림 대기중';
    }
  };

  const getContainerStyle = () => {
    switch (permission) {
      case 'granted':
        return [styles.container, styles.granted];
      case 'denied':
        return [styles.container, styles.denied];
      case 'unsupported':
        return [styles.container, styles.unsupported];
      default:
        return [styles.container, styles.default];
    }
  };

  const getTextStyle = () => {
    switch (permission) {
      case 'granted':
        return [styles.text, styles.textGranted];
      case 'denied':
        return [styles.text, styles.textDenied];
      case 'unsupported':
        return [styles.text, styles.textUnsupported];
      default:
        return [styles.text, styles.textDefault];
    }
  };

  return (
    <View style={getContainerStyle()}>
      {getIcon()}
      <Text style={getTextStyle()}>{getText()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
  },
  granted: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.2)',
  },
  denied: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.2)',
  },
  unsupported: {
    backgroundColor: 'rgba(234,179,8,0.1)',
    borderColor: 'rgba(234,179,8,0.2)',
  },
  default: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textGranted: {
    color: '#86efac',
  },
  textDenied: {
    color: '#fca5a5',
  },
  textUnsupported: {
    color: '#fde047',
  },
  textDefault: {
    color: 'rgba(255,255,255,0.5)',
  },
});
