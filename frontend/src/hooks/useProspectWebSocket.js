// src/hooks/useProspectWebSocket.js

import { useEffect, useState, useRef, useCallback } from 'react';

const useProspectWebSocket = (userCode) => {
    const [prospects, setProspects] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;

    const connect = useCallback(() => {
        if (!userCode) {
            console.warn('No user code provided');
            return;
        }

        try {
            // Determinar protocolo WebSocket
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}/ws/prospects/${userCode}/`;
            
            console.log('🔌 Connecting to:', wsUrl);

            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('✅ WebSocket connected');
                setIsConnected(true);
                setError(null);
                reconnectAttemptsRef.current = 0;
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📩 Message received:', data);

                    switch (data.type) {
                        case 'initial_data':
                            setProspects(data.prospects || []);
                            break;

                        case 'new_prospect':
                            setProspects(prev => [data.prospect, ...prev]);
                            // Notificación opcional
                            console.log('🆕 New prospect:', data.prospect);
                            break;

                        case 'new_action':
                            // Actualizar el prospecto con la nueva acción
                            setProspects(prev => 
                                prev.map(prospect => 
                                    prospect.id === data.prospect.id
                                        ? {
                                            ...prospect,
                                            actions: [data.action, ...(prospect.actions || [])],
                                            total_actions: (prospect.total_actions || 0) + 1
                                        }
                                        : prospect
                                )
                            );
                            console.log('⚡ New action:', data.action);
                            break;

                        case 'pong':
                            console.log('🏓 Pong received');
                            break;

                        default:
                            console.log('Unknown message type:', data.type);
                    }
                } catch (err) {
                    console.error('Error parsing message:', err);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                setError('WebSocket connection error');
            };

            wsRef.current.onclose = (event) => {
                console.log('🔌 WebSocket disconnected', event.code);
                setIsConnected(false);

                // Auto-reconectar
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectAttemptsRef.current += 1;
                    const delay = Math.min(1000 * reconnectAttemptsRef.current, 5000);
                    
                    console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current})`);
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, delay);
                } else {
                    setError('Max reconnection attempts reached');
                }
            };

        } catch (err) {
            console.error('Error creating WebSocket:', err);
            setError(err.message);
        }
    }, [userCode]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsConnected(false);
    }, []);

    const sendPing = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
        }
    }, []);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        prospects,
        isConnected,
        error,
        sendPing,
        reconnect: connect,
        disconnect
    };
};

export default useProspectWebSocket;